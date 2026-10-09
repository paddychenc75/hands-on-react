/* 给"哪些记录什么时候改过"打时间戳（跨设备合并时用来判断谁更新）。纯函数：当前时间 now 由调用方传入。
   只新增可选字段，不改任何现有字段：
   - 单课 `ts.lad`：练习草稿与提示阶梯那一组字段最后一次变化的时间；`ts.note`：自我解释笔记
   - 变式练习记录 `dr[i].t`、阶段测验记录 `__stage[i].t`
   做法：存储层每次保存前，把每组字段的"指纹"和上次保存时的指纹比一比，变了的就盖上 now。
   这样 exercise.ts、quiz.ts 等十几处写进度的代码一行都不用改，也不会因为多了字段改变任何学习机制。 */

export type Fingerprints = Record<string, string>;
type Obj = Record<string, any>;
// 注意：这个文件在主包里，所以不 import merge.ts（那会把整个合并逻辑拖进主包）。下面的字段表要和 merge.ts 的 LADDER_KEYS 保持一致，单元测试会核对。
export const STAMP_LADDER = ['code', 'fails', 'firstFail', 'lastFail', 'sawSol', 'rewrite', 'exHelp'];
const isObj = (v: unknown): v is Obj => v !== null && typeof v === 'object' && !Array.isArray(v);
/** 指纹：只需要"同一份数据得到同一个字符串"，不要求键排序 */
const canon = (v: unknown): string => JSON.stringify(v) ?? 'null';

const without = (o: Obj, ...ks: string[]): Obj => {
  const c: Obj = { ...o };
  for (const k of ks) delete c[k];
  return c;
};

/** 当前每组字段的指纹。空的组（没有任何字段）不出现 */
export function fingerprints(p: Obj): Fingerprints {
  const f: Fingerprints = {};
  for (const [id, v] of Object.entries(p)) {
    if (!isObj(v)) continue;
    if (id === '__stage') {
      for (const [i, r] of Object.entries(v)) if (isObj(r)) f['s|' + i] = canon(without(r, 't'));
      continue;
    }
    if (id.startsWith('__')) continue;
    const lad: Obj = {};
    for (const k of STAMP_LADDER) if (v[k] !== undefined) lad[k] = v[k];
    if (Object.keys(lad).length) f[id + '|lad'] = canon(lad);
    if (typeof v.note === 'string') f[id + '|note'] = v.note;
    if (isObj(v.dr)) for (const [i, r] of Object.entries(v.dr)) if (isObj(r)) f[id + '|dr|' + i] = canon(without(r, 't'));
  }
  return f;
}

/** 把和 snap 不同的组盖上时间戳，并更新 snap。返回是否盖了章 */
export function stamp(p: Obj, snap: Fingerprints, now: number): boolean {
  const cur = fingerprints(p);
  let changed = false;
  for (const [key, fp] of Object.entries(cur)) {
    if (snap[key] === fp) continue;
    const parts = key.split('|');
    if (parts[0] === 's') p.__stage[parts[1]].t = now;
    else if (parts[1] === 'dr') p[parts[0]].dr[parts[2]].t = now;
    else {
      const l = p[parts[0]];
      l.ts = isObj(l.ts) ? l.ts : {};
      l.ts[parts[1]] = now;
    }
    changed = true;
  }
  for (const k of Object.keys(snap)) delete snap[k];
  Object.assign(snap, cur);
  return changed;
}
