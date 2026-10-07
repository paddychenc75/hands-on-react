// remark 插件：把带 play 标记的围栏代码块变成 <Playground code=… title=… />。
//
//   ```jsx play title="示例标题"          → <Playground code="…" title="示例标题" />
//   ```jsx play title="同名时" key="#2"   → key 属性用于区分同课里标题相同（或没有标题）的示例
//
// 代码作为字符串属性传入，作者不用转义 { < 等字符。
// 其余代码块不动，交给 Rspress（shiki）。
const META = /(?:^|\s)(title|key)=(?:"([^"]*)"|'([^']*)'|`([^`]*)`)/g;

export function parsePlayMeta(meta) {
  if (!meta || !/(?:^|\s)play(?:\s|$)/.test(meta)) return null;
  const out = {};
  for (const m of meta.matchAll(META)) out[m[1]] = m[2] ?? m[3] ?? m[4];
  return out;
}

const attr = (name, value) => ({ type: 'mdxJsxAttribute', name, value });

function walk(node, fn) {
  if (!node.children) return;
  node.children.forEach((child, i) => {
    if (child.type === 'code') {
      const repl = fn(child);
      if (repl) node.children[i] = repl;
    } else walk(child, fn);
  });
}

export default function remarkPlay() {
  return (tree) => {
    walk(tree, (node) => {
      const m = parsePlayMeta(node.meta);
      if (!m) return null;
      const attributes = [attr('code', node.value)];
      if (m.title !== undefined) attributes.push(attr('title', m.title));
      if (m.key !== undefined) attributes.push(attr('playKey', m.key));
      return { type: 'mdxJsxFlowElement', name: 'Playground', attributes, children: [] };
    });
  };
}
