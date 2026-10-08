// 逐课测试（由旧版 tests/lessons.mjs 移植）：打开每一课，滚动让每个实验台运行，回答预测题，
// 把参考答案（solution）填进练习点“检查答案”，要求每道练习 PASS，且没有意外的 .pv-err / .err。
// 用法：node tests/e2e/lessons.mjs [课 id ...]      （先 npm run build）
// 期望最后一行：lessons 50 with issues 0。PAGEERR 行多数是课程示例故意抛出的错误（例如 suspense 课的 boom），不计入问题。
import { launch, openSite, lessonUrl, lessonData, lessonOrder } from './_site.mjs';

const only = process.argv.slice(2);
const ids = (await lessonOrder()).filter(id => !only.length || only.includes(id));
const { site, close } = await openSite();
const b = await launch();
// 课程里故意演示的错误（错误边界示例会显示“渲染出错”），不算问题
const EXPECTED = [/boom/];
const CONCURRENCY = 4;

async function testLesson(id) {
  const L = await lessonData(id);
  const ctx = await b.newContext({ viewport: { width: 1280, height: 900 } });
  const p = await ctx.newPage();
  const logs = [];
  p.on('pageerror', e => logs.push('PAGEERR ' + e.message));
  await p.goto(lessonUrl(site, id));
  await p.waitForSelector('.selfx', { timeout: 60000 });
  if (L.drills?.length) await p.waitForFunction(n => document.querySelectorAll('.drill .pg').length >= n, L.drills.length, { timeout: 60000 });
  if (L.exercise)
    await p.waitForFunction(() => [...document.querySelectorAll('.pg')].some(x => x._editor && x.querySelector('.pg-badge.ex')), null, { timeout: 60000 });
  await p.waitForTimeout(800);
  // 示例是懒运行的：滚动一遍让所有实验台都运行
  await p.evaluate(async () => {
    for (const pg of document.querySelectorAll('.pg')) {
      pg.scrollIntoView();
      await new Promise(r => setTimeout(r, 60));
    }
    window.scrollTo(0, 0);
  });
  await p.evaluate(async () => {
    document.querySelectorAll('.predict .opts .opt:first-child').forEach(b => b.click());
    await new Promise(r => setTimeout(r, 50));
    document.querySelectorAll('.predict .btn.primary').forEach(b => b.click());
  });
  await p.waitForTimeout(1500);
  const r = await p.evaluate(
    async ({ solution, hasEx, drills }) => {
      const out = [];
      document.querySelectorAll('.pv-err').forEach(e => out.push('PVERR ' + e.textContent.slice(0, 120)));
      document.querySelectorAll('.err').forEach(e => out.push('ERR ' + e.textContent.slice(0, 120)));
      if (hasEx) {
        const btn = [...document.querySelectorAll('button')].find(x => x.textContent.trim() === '✓ 检查答案');
        let pg = btn;
        while (pg && !pg._editor) pg = pg.parentElement;
        if (!btn || !pg) out.push('NO BTN/PG');
        else {
          pg._editor.value = solution;
          await new Promise(r => setTimeout(r, 400));
          btn.click();
          for (let i = 0; i < 100 && btn.disabled; i++) await new Promise(r => setTimeout(r, 200));
          await new Promise(r => setTimeout(r, 300));
          const txt = pg.querySelector('.result').innerText;
          out.push(txt.includes('通过') && !txt.startsWith('✗') ? 'PASS' : 'FAIL ' + txt.slice(0, 200));
        }
      }
      // 变式练习:每道填参考答案要通过,填起始代码要被拒
      const checkDrill = async (box, code) => {
        const pg = box.querySelector('.pg');
        const btn = [...box.querySelectorAll('button')].find(x => x.textContent.trim() === '✓ 检查答案');
        pg._editor.value = code;
        await new Promise(r => setTimeout(r, 400));
        btn.click();
        for (let i = 0; i < 100 && btn.disabled; i++) await new Promise(r => setTimeout(r, 200));
        await new Promise(r => setTimeout(r, 300));
        return box.querySelector('.result').innerText;
      };
      const boxes = [...document.querySelectorAll('.drill')];
      for (let i = 0; i < drills.length; i++) {
        if (!boxes[i]) {
          out.push(`DRILL${i + 1} NO BOX`);
          continue;
        }
        const bad = await checkDrill(boxes[i], drills[i].starter);
        out.push(bad.startsWith('✗') ? `DRILL${i + 1} starter-rejected` : `DRILL${i + 1} FAIL starter accepted: ${bad.slice(0, 120)}`);
        const txt = await checkDrill(boxes[i], drills[i].solution);
        out.push(txt.includes('通过') && !txt.startsWith('✗') ? `DRILL${i + 1} PASS` : `DRILL${i + 1} FAIL ${txt.slice(0, 200)}`);
      }
      return out;
    },
    {
      solution: L.exercise ? L.exercise.solution : '',
      hasEx: !!L.exercise,
      drills: (L.drills || []).map(d => ({ starter: d.starter, solution: d.solution })),
    },
  );
  await ctx.close();
  const all = [...logs, ...r];
  const issue = r.some(x => !/^(PASS|DRILL\d+ (PASS|starter-rejected))/.test(x) && !EXPECTED.some(re => re.test(x)));
  return { id, line: id + ' ' + all.join(' | '), issue };
}

const results = new Array(ids.length);
let next = 0;
await Promise.all(
  Array.from({ length: CONCURRENCY }, async () => {
    while (next < ids.length) {
      const i = next++;
      try {
        results[i] = await testLesson(ids[i]);
      } catch (e) {
        results[i] = { id: ids[i], line: ids[i] + ' EXCEPTION ' + e.message.split('\n')[0], issue: true };
      }
    }
  }),
);
let bad = 0;
for (const r of results) {
  console.log(r.line);
  if (r.issue) bad++;
}
console.log('lessons', ids.length, 'with issues', bad);
await b.close();
close();
process.exit(bad ? 1 : 0);
