// 用法：node scripts/lesson-mins.mjs [--write] [课id …]      （npm run mins）
// 按 AGENTS.md「估算 mins」的公式重新计算每课的时长，和数据文件里的 mins 对照：现值 / 公式值 / 偏差。
// 偏差超过 ±20% 的课标 “!”；--write 把公式值写回各课数据文件的 mins（不改别的字段），写完要跑 npm run gen 更新轻量目录。
//
// 公式（系数取自 AGENTS.md）：
//   正文每 300 字 1 分钟（正文字数不含代码块、行内代码标记和标签）
//   + 每个可运行示例（play 代码块）2 分钟
//   + 每道测验 1 分钟
//   + 一道正式练习 15 分钟（AGENTS.md 写“10~20”，按中值计）
//   项目课（没有可运行示例、整课就是一个分步完成的项目）的综合练习按 30 分钟计，代替上一行的 15 分钟
// 变式练习不计入 mins（它们是选做，单独记 drillMins）。
// 现值和公式值相差在 ±20% 以内算合理，不用改；超出就要改（--write 只改这些课），check:content 也会拦。
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
export const COEF = { charsPerMin: 300, play: 2, quiz: 1, exercise: 15, projectExercise: 30 };
export const THRESHOLD = 0.2;

/** 正文字数：去掉 front matter、围栏代码块、import 行、JSX/HTML 标签、行内代码的反引号、Markdown 标记后，数非空白字符 */
export function proseChars(mdx) {
  let s = mdx.replace(/^---[\s\S]*?---\n/, '');
  s = s.replace(/^(```|~~~)[^\n]*\n[\s\S]*?^\1[ \t]*$/gm, ' ');
  s = s.replace(/<[^>]+>/g, ' ');
  s = s.replace(/`/g, '').replace(/[#*>|_\-[\]()]/g, ' ');
  return s.replace(/\s+/g, '').length;
}

/** 项目课：有练习、没有可运行示例（整课就是一个分步完成的项目） */
export const isProjectLesson = meta => meta.hasExercise && meta.nPlays === 0;

export function formula(meta, chars) {
  const ex = meta.hasExercise ? (isProjectLesson(meta) ? COEF.projectExercise : COEF.exercise) : 0;
  const raw = chars / COEF.charsPerMin + meta.nPlays * COEF.play + meta.quizAnswers.length * COEF.quiz + ex;
  return Math.max(1, Math.round(raw));
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  const { CATALOG } = await import(path.join(ROOT, 'course/lessons.catalog.generated.ts'));
  const { LESSON_ORDER } = await import(path.join(ROOT, 'course/order.ts'));
  const args = process.argv.slice(2);
  const write = args.includes('--write');
  const only = args.filter(a => !a.startsWith('--'));
  const rows = [];
  for (const id of LESSON_ORDER) {
    if (only.length && !only.includes(id)) continue;
    const m = CATALOG[id];
    const chars = proseChars(fs.readFileSync(path.join(ROOT, 'docs/lessons', id + '.mdx'), 'utf8'));
    const f = formula(m, chars);
    rows.push({ id, now: m.mins, f, dev: (m.mins - f) / f, chars, plays: m.nPlays, quiz: m.quizAnswers.length, ex: m.hasExercise });
  }
  const pct = d => (d >= 0 ? '+' : '') + Math.round(d * 100) + '%';
  console.log('课 id'.padEnd(22), '现值'.padStart(5), '公式值'.padStart(6), '偏差'.padStart(6), '  字数 示例 测验 练习');
  for (const r of rows)
    console.log(
      r.id.padEnd(22),
      String(r.now).padStart(5),
      String(r.f).padStart(6),
      pct(r.dev).padStart(6),
      Math.abs(r.dev) > THRESHOLD ? '!' : ' ',
      String(r.chars).padStart(5),
      String(r.plays).padStart(4),
      String(r.quiz).padStart(4),
      r.ex ? '  有' : '  无',
    );
  const sum = k => rows.reduce((s, r) => s + r[k], 0);
  console.log(
    `合计：现值 ${sum('now')} 分钟，公式值 ${sum('f')} 分钟；偏差超过 ±${THRESHOLD * 100}% 的课 ${rows.filter(r => Math.abs(r.dev) > THRESHOLD).length} 个`,
  );
  if (write) {
    for (const r of rows) {
      if (Math.abs(r.dev) <= THRESHOLD) continue;
      const file = path.join(ROOT, 'course/lessons', r.id + '.ts');
      const src = fs.readFileSync(file, 'utf8');
      const next = src.replace(/^(\s*)mins: \d+/m, `$1mins: ${r.f}`);
      if (next === src) throw new Error(`${r.id}：没找到可替换的 mins`);
      fs.writeFileSync(file, next);
    }
    console.log('已写回；请运行 npm run gen 更新轻量目录');
  }
}
