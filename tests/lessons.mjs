// 逐课打开页面：运行全部示例，回答预测题，把每道练习的参考答案填进编辑器并点“检查答案”。
// 用法：node tests/lessons.mjs [html 文件，默认 dist/react-course.html] [课 id ...]
// 期望：每道练习 PASS，最后一行 "with issues 0"。PAGEERR 行多数是课程示例故意抛出的错误（例如 suspense 课的 boom），不计入问题。
import { launch, pageUrl } from './_browser.mjs';
const [file = 'dist/react-course.html', ...only] = process.argv.slice(2);
const b = await launch();
const p = await b.newPage();
p.on('pageerror', e => console.log('PAGEERR', e.message));
await p.goto(pageUrl(file));
await p.waitForFunction(() => typeof LESSONS !== 'undefined' && document.querySelector('.side a'), null, { timeout: 60000 });
const ids = (await p.evaluate(() => LESSONS.map(l => l.id))).filter(id => !only.length || only.includes(id));
// 课程里故意演示的错误（错误边界示例会显示“渲染出错”），不算问题
const EXPECTED = [/boom/];
let bad = 0;
for (const id of ids) {
  await p.evaluate(id => { location.hash = id; }, id);
  await p.waitForTimeout(1500);
  // 示例是懒运行的：滚动一遍让所有实验台都运行
  await p.evaluate(async () => { for (const pg of document.querySelectorAll('.pg')) { pg.scrollIntoView(); await new Promise(r => setTimeout(r, 60)); } window.scrollTo(0, 0); });
  await p.evaluate(async () => { document.querySelectorAll('.predict .opts .opt:first-child').forEach(b => b.click()); await new Promise(r => setTimeout(r, 50)); document.querySelectorAll('.predict .btn.primary').forEach(b => b.click()); });
  await p.waitForTimeout(1500);
  const r = await p.evaluate(async (id) => {
    const out = [];
    document.querySelectorAll('.pv-err').forEach(e => out.push('PVERR ' + e.textContent.slice(0, 120)));
    document.querySelectorAll('.err').forEach(e => out.push('ERR ' + e.textContent.slice(0, 120)));
    const L = LESSONS.find(l => l.id === id);
    if (L.exercise) {
      const btn = [...document.querySelectorAll('button')].find(x => x.textContent.trim() === '✓ 检查答案');
      let pg = btn; while (pg && !pg._editor) pg = pg.parentElement;
      if (!btn || !pg) out.push('NO BTN/PG');
      else {
        pg._editor.value = L.exercise.solution; await new Promise(r => setTimeout(r, 400));
        btn.click();
        for (let i = 0; i < 100 && btn.disabled; i++) await new Promise(r => setTimeout(r, 200));
        await new Promise(r => setTimeout(r, 300));
        const txt = pg.querySelector('.result').innerText;
        out.push(txt.includes('通过') && !txt.startsWith('✗') ? 'PASS' : 'FAIL ' + txt.slice(0, 200));
      }
    }
    return out;
  }, id);
  if (r.some(x => !x.startsWith('PASS') && !EXPECTED.some(re => re.test(x)))) bad++;
  console.log(id, r.join(' | '));
}
console.log('lessons', ids.length, 'with issues', bad);
await b.close();
process.exit(bad ? 1 : 0);
