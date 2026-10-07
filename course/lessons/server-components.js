// 非正文数据。课文在 docs/lessons/server-components.mdx；plays 的键是示例标题（重名或无标题时是 #序号），对应 MDX 里的 ```jsx play 代码块。
export default {
  id: 'server-components',
  stage: 3,
  title: 'Server Components 与全栈 React',
  mins: 30,
  summary: '组件在服务器上运行意味着什么？SSR、RSC、Server Functions 一次讲清。',
  goals: [
    '能按顺序说出一次页面请求经过的步骤：服务端组件 → SSR → 水合',
    '能判断一个组件该是服务端组件还是客户端组件，并把 "use client" 放在叶子上',
    '能找出跨越服务端和客户端边界的不可序列化 props',
    '能为 Server Function 写上登录、权限和输入校验',
  ],
  keyPoints: [
    'SSR 把组件渲染成 HTML，让首屏更快。水合让这份 HTML 变得可交互。',
    '组件默认是服务端组件：只在服务器运行，代码不发送到浏览器，也不需要水合。需要 state、effect 或事件处理函数时，才在文件顶部写 <code>"use client"</code>。',
    '<code>"use client"</code> 标记的是边界：被它导入的模块都会成为客户端代码，所以尽量放在叶子上。跨过边界的 props 必须可序列化，普通函数不行。',
    '<code>"use server"</code> 标记的是可以被客户端调用的服务器函数，不是服务端组件。每个 Server Function 都是公开接口，要自己检查登录、权限和输入。',
    '常见坑：水合不匹配。渲染时用了 <code>Date</code>、<code>Math.random()</code> 或 <code>window</code>，服务器和浏览器的结果就不一样。',
  ],
  quiz: [
    {
      q: '服务端组件写 &lt;AddToCart onAdded={() =&gt; console.log("ok")} /&gt;，AddToCart 是客户端组件。会怎样？',
      options: ['正常工作', '报错：函数不能序列化，不能从服务端组件传给客户端组件', '点击时，函数回到服务器上执行', '函数被悄悄忽略，onAdded 是 undefined'],
      answer: 1,
      explain: 'props 要从服务器经过网络发到浏览器，只有可序列化的值和 Server Function 可以传。普通函数无法序列化，React 会报错，而不是悄悄忽略。“回到服务器执行”是 Server Function 的行为，普通函数没有这个能力。',
    },
    {
      q: 'app/actions.js 顶部写了 "use server"，并导出 async function deletePost(id)。哪项说法正确？',
      options: [
        'deletePost 只能被服务端组件调用，浏览器里的代码调不到它',
        '它成了公开接口，任何人都能调用，要检查权限',
        'deletePost 的代码会被打包进浏览器',
        '"use server" 让这个文件里的组件变成服务端组件',
      ],
      answer: 1,
      explain: '"use server" 标记的是可以被客户端调用的服务器函数。框架为它生成接口，浏览器通过网络调用它，函数代码留在服务器。第一项是最危险的误解：以为“server”就代表外人调不到，于是省掉权限检查。组件默认就是服务端组件，不需要标记。',
    },
    {
      q: '商品页是服务端组件，里面只有“加入购物车”按钮需要点击。"use client" 写在哪里最好？',
      options: [
        '写在商品页 page.jsx 的顶部',
        '写在只包含按钮的 AddToCart.jsx 顶部',
        '写在根布局 layout.jsx 的顶部，一次覆盖所有页面',
        '每个文件都写',
      ],
      answer: 1,
      explain: '"use client" 标记的是边界：被它导入的所有模块都会打包到浏览器。写在叶子 AddToCart 上，商品列表、数据库查询都留在服务器。写在 page.jsx 上，整个页面都变成客户端代码，还不能直接查数据库。',
    },
  ],
  exercise: {
    task: '<ol class="task-steps"><li>服务端组件要把 <code>props</code> 里的值传给客户端组件。补全 <code>canCross(value)</code>，判断一个值能不能跨过这条边界。</li><li>规则：null、undefined、字符串、数字、布尔值可以；Date 可以；函数只有 Server Function 可以。</li><li>数组和普通对象：里面的每一项都可以，它才可以。要递归检查。</li><li>其他对象（例如 class 的实例）不可以。真实的 React 还支持 Map、Set、Promise 等少数内置类型，本题不考。</li><li>运行后，表格里 onBuy、owner、variants 三行应显示“❌ 不能传”，其余显示“✅ 可以传”。</li></ol>',
    starter: `// 模拟 Server Function：框架会给 'use server' 导出的函数打上标记（不用修改）
function serverFunction(fn) {
  fn.isServerFunction = true;
  return fn;
}

class User {
  constructor(name) { this.name = name; }
  greet() { return '你好，' + this.name; }
}

// 判断一个值能不能作为 props，从服务端组件传给客户端组件
function canCross(value) {
  // 1. null、undefined、字符串、数字、布尔值：可以
  // 2. 函数：只有 Server Function（isServerFunction 为 true）可以
  // 3. 数组：每一项都可以，整个数组才可以
  // 4. Date：可以
  // 5. 普通对象（原型是 Object.prototype 或 null）：每个属性值都可以，才可以
  // 6. 其他对象，例如 class 的实例：不可以
  return true; // 占位：换成你的实现
}

// 服务端组件想传给客户端组件 <ProductCard> 的 props
const props = {
  title: '机械键盘',
  price: 399,
  tags: ['新品', '包邮'],
  releasedAt: new Date('2025-01-01'),
  seller: { name: '小李', rating: 4.8 },
  onBuy: () => console.log('买！'),
  addToCart: serverFunction(async (id) => {}),
  owner: new User('小王'),
  variants: [{ color: '黑' }, { color: '白', onPick: () => {} }],
};

function App() {
  return (
    <table>
      <tbody>
        {Object.entries(props).map(([name, value]) => (
          <tr key={name}>
            <td>{name}</td>
            <td id={'row-' + name}>{canCross(value) ? '✅ 可以传' : '❌ 不能传'}</td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}`,
    solution: `// 模拟 Server Function：框架会给 'use server' 导出的函数打上标记（不用修改）
function serverFunction(fn) {
  fn.isServerFunction = true;
  return fn;
}

class User {
  constructor(name) { this.name = name; }
  greet() { return '你好，' + this.name; }
}

// 判断一个值能不能作为 props，从服务端组件传给客户端组件
function canCross(value) {
  if (value === null || value === undefined) return true;
  const type = typeof value;
  if (type === 'string' || type === 'number' || type === 'boolean') return true;
  if (type === 'function') return value.isServerFunction === true;
  if (Array.isArray(value)) return value.every(canCross);
  if (value instanceof Date) return true;
  const proto = Object.getPrototypeOf(value);
  if (proto === Object.prototype || proto === null) return Object.values(value).every(canCross);
  return false;
}

// 服务端组件想传给客户端组件 <ProductCard> 的 props
const props = {
  title: '机械键盘',
  price: 399,
  tags: ['新品', '包邮'],
  releasedAt: new Date('2025-01-01'),
  seller: { name: '小李', rating: 4.8 },
  onBuy: () => console.log('买！'),
  addToCart: serverFunction(async (id) => {}),
  owner: new User('小王'),
  variants: [{ color: '黑' }, { color: '白', onPick: () => {} }],
};

function App() {
  return (
    <table>
      <tbody>
        {Object.entries(props).map(([name, value]) => (
          <tr key={name}>
            <td>{name}</td>
            <td id={'row-' + name}>{canCross(value) ? '✅ 可以传' : '❌ 不能传'}</td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}`,
    hint: '1. 先处理简单值，再处理函数：看 <code>value.isServerFunction</code>。2. 数组用 <code>value.every(canCross)</code> 递归。3. 区分普通对象和 class 实例：<code>Object.getPrototypeOf(value)</code> 是 <code>Object.prototype</code> 或 null 的才是普通对象，再用 <code>Object.values(value).every(canCross)</code> 递归。Date 要在这一步之前判断。',
    faded: `// 模拟 Server Function：框架会给 'use server' 导出的函数打上标记（不用修改）
function serverFunction(fn) {
  fn.isServerFunction = true;
  return fn;
}

class User {
  constructor(name) { this.name = name; }
  greet() { return '你好，' + this.name; }
}

// 判断一个值能不能作为 props，从服务端组件传给客户端组件
function canCross(value) {
  if (value === null || value === undefined) return true;
  const type = typeof value;
  if (type === 'string' || type === 'number' || type === 'boolean') return true;
  /* ✏️ 函数：只有带 isServerFunction 标记的才可以 */
  /* ✏️ 数组：递归检查每一项 */
  if (value instanceof Date) return true;
  const proto = Object.getPrototypeOf(value);
  /* ✏️ 普通对象：递归检查每个属性值 */
  return false;
}

// 服务端组件想传给客户端组件 <ProductCard> 的 props
const props = {
  title: '机械键盘',
  price: 399,
  tags: ['新品', '包邮'],
  releasedAt: new Date('2025-01-01'),
  seller: { name: '小李', rating: 4.8 },
  onBuy: () => console.log('买！'),
  addToCart: serverFunction(async (id) => {}),
  owner: new User('小王'),
  variants: [{ color: '黑' }, { color: '白', onPick: () => {} }],
};

function App() {
  return (
    <table>
      <tbody>
        {Object.entries(props).map(([name, value]) => (
          <tr key={name}>
            <td>{name}</td>
            <td id={'row-' + name}>{canCross(value) ? '✅ 可以传' : '❌ 不能传'}</td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}`,
    exports: ['canCross'],
    test: async (t) => {
      const cell = (name) => t.text('#row-' + name);
      const ok = (name) => cell(name).includes('✅');
      t.assert(['title', 'price', 'tags'].every(ok), 'title、price、tags 都只含字符串和数字，应该可以传');
      t.assert(!ok('onBuy'), 'onBuy 是一个普通函数，不能传：函数的代码没法变成数据发给浏览器。只有 Server Function（isServerFunction 为 true）可以');
      t.assert(ok('addToCart'), 'addToCart 是 Server Function，可以传：浏览器拿到的只是一个引用，调用时请求会回到服务器执行');
      t.assert(ok('releasedAt'), 'releasedAt 是 Date，可以传。检查 Date 的判断写在“其他对象”之前了吗？');
      t.assert(ok('seller'), 'seller 是普通对象，每个属性值都可以传，所以它也可以传');
      t.assert(!ok('owner'), 'owner 是 class User 的实例，不能传：浏览器只收到数据，原型和 greet 方法都会丢失。用 Object.getPrototypeOf 区分普通对象和 class 实例');
      t.assert(!ok('variants'), 'variants 数组里的第二个对象有一个函数 onPick，所以整个数组都不能传。数组和对象要递归检查每一项');
      const { canCross } = t.exports;
      t.assert(typeof canCross === 'function', '没有找到 canCross 函数');
      class Point { constructor() { this.x = 1; } }
      const cases = [
        [null, true, 'null'], [undefined, true, 'undefined'], [0, true, '0'], ['', true, '空字符串'], [false, true, 'false'],
        [[], true, '空数组'], [{}, true, '空对象'], [Object.assign(Object.create(null), { a: 1 }), true, '原型为 null 的对象 { a: 1 }'],
        [{ a: { b: [1, { c: () => 1 }] } }, false, '深层藏着一个函数的 { a: { b: [1, { c: () => 1 }] } }'],
        [{ when: new Date(0) }, true, '{ when: new Date(0) }'],
        [[new Point()], false, '[new Point()]（class 的实例）'],
        [function save() {}, false, '普通函数 save'],
      ];
      for (const [v, want, label] of cases) {
        const got = canCross(v);
        t.assert(got === want, `canCross(${label}) 应返回 ${want}，实际是 ${got}`);
      }
    },
  },
  checkOnly: [
    {
      q: `<code>page.js</code> 是服务端组件，<code>Tabs</code> 是客户端组件。这样写可以吗？<div class="codeblock faded"><pre style="white-space:pre-wrap"><code style="background:none;color:inherit;padding:0;font-size:inherit">// Tabs.js
'use client';
export default function Tabs({ children }) { /* 用了 useState */ }

// page.js（服务端组件）
import Tabs from './Tabs';
import Stats from './Stats'; // 服务端组件，会查数据库

export default function Page() {
  return &lt;Tabs&gt;&lt;Stats /&gt;&lt;/Tabs&gt;;
}</code></pre></div>`,
      options: [
        '可以：Stats 仍在服务器上渲染，结果作为 children 传给 Tabs',
        '报错：客户端组件里不能出现服务端组件',
        '可以，但 Stats 会变成客户端组件，在浏览器中查数据库',
        '只能把 Stats 改成 props 而不是 children',
      ],
      answer: 0,
      explain: '客户端组件不能 <b>import</b> 服务端组件，但可以通过 children 接收它。Stats 由服务端组件 Page 创建，在服务器上渲染。Tabs 收到的只是渲染结果。这样交互部分在客户端，数据部分留在服务器。',
    },
    {
      q: `这个组件能运行吗？<div class="codeblock faded"><pre style="white-space:pre-wrap"><code style="background:none;color:inherit;padding:0;font-size:inherit">'use client';
import { db } from './db';

export default async function Cart() {
  const items = await db.cart.findMany();
  return &lt;ul&gt;{items.map(i =&gt; &lt;li key={i.id}&gt;{i.name}&lt;/li&gt;)}&lt;/ul&gt;;
}</code></pre></div>`,
      options: [
        '不能：客户端组件不能是 async 函数',
        '能：框架会自动把它放到服务器上运行',
        '能运行，但每次渲染都会在浏览器里查一次数据库',
        '能：客户端组件也可以 await',
      ],
      answer: 0,
      explain: '<code>\'use client\'</code> 表示这个文件及它导入的模块都会发送到浏览器。客户端组件不支持 async/await，React 会报错。即使能运行，浏览器里也拿不到数据库连接，而且密钥可能泄露。修复：去掉 <code>\'use client\'</code>，让它成为服务端组件；需要交互的部分再拆成小的客户端组件。“框架会自动放到服务器上运行”是最常见的误解：这条指令正好表示相反的意思。',
    },
  ],
  plays: {},
};
