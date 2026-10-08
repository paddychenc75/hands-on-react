import type { Lesson } from '../types.ts';
// 非正文数据。课文在 docs/lessons/tanstack-query.mdx；plays 的键是示例标题（重名或无标题时是 #序号），对应 MDX 里的 ```jsx play 代码块。
export default {
  id: 'tanstack-query',
  stage: 4,
  title: '数据请求：TanStack Query',
  mins: 46,
  summary: '把“服务端状态”交给专业工具：缓存、去重、后台刷新、乐观更新。',
  goals: [
    '能列出 useEffect 手写请求没有解决的三个问题：重复请求、没有缓存、数据过期',
    '能写出 useQuery：queryKey 包含查询用到的每个变量，并按加载中、出错、成功渲染',
    '能预测 staleTime 不同时，切回页面会不会发请求',
    '能用 useMutation 加 invalidateQueries，在修改数据后刷新列表',
    '能区分 useQuery 的 status 和 fetchStatus，并预测两个组件用同一个 queryKey 时发出几次请求',
  ],
  keyPoints: [
    '问题：服务端数据需要缓存、去重、过期刷新和重试。用 useEffect 手写，每个组件都要重复这些代码。',
    "<code>queryKey</code> 是缓存的名字。queryFn 用到的每个变量都要写进 key，例如 <code>['user', id]</code>。",
    '<code>staleTime</code> 内数据算新鲜，直接用缓存。过期后，在组件挂载、窗口重新获得焦点时，先显示缓存，再在后台刷新。默认值是 0。',
    '修改数据用 <code>useMutation</code>，成功后用 <code>invalidateQueries</code> 让相关缓存失效，列表自动重新获取。',
    '实验台能运行真的 TanStack Query（5.104.1）。数据都来自返回 Promise 的模拟函数，不发真实请求。真库失败后默认重试 3 次，间隔 1、2、4 秒，所以要等 7 秒以上才报错。',
    '最常见的坑：key 里漏了变量（切换 id 读到别人的缓存）；queryFn 里 fetch 失败不抛错（isError 永远是 false）。',
  ],
  quiz: [
    {
      q: "useQuery({ queryKey: ['user'], queryFn: () => getUser(id) }) 有什么问题？",
      options: [
        '没有问题：id 变了 queryFn 也会跟着变，自动请求新用户',
        'key 里没有 id，切换后读到上一个用户的缓存',
        'queryFn 必须写成 async 函数',
        '读取数据应该用 useMutation',
      ],
      answer: 1,
      explain:
        "缓存按 queryKey 存取。key 一直是 ['user']，切到新 id 时，Query 认为“这份数据已经有了”，直接返回上一个用户。最有迷惑性的是“queryFn 也会跟着变”：queryFn 确实是新函数，但 Query 只看 key 决定是否重新请求。要写成 ['user', id]。",
    },
    {
      q: '添加一条待办后，想让列表自动更新，最常用的做法是？',
      options: [
        '在 onSuccess 中把 staleTime 改为 0，让列表立刻变成过期状态',
        '在 onSuccess 中调用 invalidateQueries 让列表缓存失效',
        '在组件里另存一份列表，手动调用 set 函数追加',
        '在 onSuccess 中再调用一次 useQuery',
      ],
      answer: 1,
      explain:
        '让缓存失效后，所有使用这份数据的组件会自动重新获取。staleTime 改为 0 不会立刻触发请求，要等组件下次挂载或窗口获得焦点。另存一份列表会出现两个数据源，容易不同步。useQuery 是 Hook，不能在回调里调用。',
    },
    {
      q: 'useQuery 没有设置 staleTime（默认为 0）。用户 1 的数据已在缓存中。从别的页面切回用户 1 时，会怎样？',
      options: ['直接显示缓存，不发请求', '先显示缓存，同时在后台重新请求', '显示加载中，等新数据回来以后再显示列表', '缓存已经过期被删除，重新请求'],
      answer: 1,
      explain:
        'staleTime 为 0 表示数据一到手就算“过期”。过期不等于没有：Query 先显示缓存，再在后台刷新。“显示加载中”混淆了“过期”和“没有缓存”。“被删除”混淆了 staleTime 和 gcTime：没人使用的缓存默认 5 分钟后才删除。',
    },
    {
      q: 'staleTime 是 60 秒。用户 30 秒后切回这个页面，会怎样？',
      options: ['直接显示缓存，不发请求', '先显示缓存，再在后台请求', '显示加载中，并重新请求', '缓存已被删除，重新请求'],
      answer: 0,
      explain:
        '30 秒时数据还新鲜，所以不请求。“先显示缓存，再在后台请求”是过期之后（60 秒以后）的行为。staleTime 决定何时“过期”；gcTime 决定没人使用的缓存何时被删除（默认 5 分钟）。',
    },
  ],
  exercise: {
    task: '<ol class="task-steps"><li>不要修改“模拟后端”（<code>fetchUser</code>）。它不发真实请求，每次约 300 毫秒，用户 4 会失败。<code>QueryClient</code> 和 <code>QueryClientProvider</code> 已经写好。</li><li>在 <code>UserCard</code> 中调用 <code>useQuery</code>。<code>queryKey</code> 要包含 <code>id</code>，<code>queryFn</code> 调用 <code>fetchUser(id)</code>。</li><li>设置 <code>staleTime</code>（例如 <code>60_000</code>）。新鲜期内，切回看过的用户不再发请求。</li><li>按状态渲染三种界面：加载中显示 <code>#loading</code>；出错显示 <code>#error</code>，内容包含 <code>error.message</code>；成功显示 <code>#user</code>，内容是用户名。</li><li>真库在请求失败后默认重试 3 次，要等 8 秒左右才显示错误。给 <code>useQuery</code> 加 <code>retry: false</code>（也可以写在 <code>new QueryClient</code> 的 <code>defaultOptions</code> 里），用户 4 才会立刻显示 <code>#error</code>。</li><li>依次点 用户 2、用户 1、用户 4，看控制台里的请求次数。切回用户 1 时，名字应立刻出现，请求次数不变。</li></ol>',
    starter: `import { useState } from 'react';
import { QueryClient, QueryClientProvider, useQuery } from '@tanstack/react-query';

// ===== 模拟后端（不要修改） =====
// 不发真实请求：fetchUser 返回 Promise，约 300 毫秒后成功；用户 4 不存在，会失败。
const stats = { calls: 0 };   // 请求次数
function fetchUser(id) {
  return new Promise((resolve, reject) => setTimeout(() => {
    stats.calls++;
    console.log('🌐 请求用户 ' + id + '（累计 ' + stats.calls + ' 次）');
    const names = { 1: '张三', 2: '李四', 3: '王五' };
    if (names[id]) resolve({ id, name: names[id] });
    else reject(new Error('用户 ' + id + ' 不存在'));
  }, 300));
}

const queryClient = new QueryClient();

// ===== 你的代码 =====
function UserCard({ id }) {
  // 步骤 2：调用 useQuery。queryKey 要包含 id；queryFn 调用 fetchUser(id)。
  // 步骤 3：设置 staleTime，例如 60_000（1 分钟）。
  // 步骤 5：真库失败后默认重试 3 次，间隔 1、2、4 秒，要等 8 秒左右才报错。给它加 retry: false，用户 4 才会立刻出错。

  // 步骤 4：按状态渲染：
  //   加载中 → <p id="loading">加载中…</p>
  //   出错   → <p id="error">出错了：{error.message}</p>
  //   成功   → <p id="user">{data.name}</p>
  return <p>TODO</p>;
}

function App() {
  const [id, setId] = useState(1);
  return (
    <QueryClientProvider client={queryClient}>
      {[1, 2, 3, 4].map(n => (
        <button key={n} data-id={n} onClick={() => setId(n)} disabled={n === id}>用户 {n}</button>
      ))}
      <UserCard id={id} />
    </QueryClientProvider>
  );
}`,
    solution: `import { useState } from 'react';
import { QueryClient, QueryClientProvider, useQuery } from '@tanstack/react-query';

// ===== 模拟后端（不要修改） =====
// 不发真实请求：fetchUser 返回 Promise，约 300 毫秒后成功；用户 4 不存在，会失败。
const stats = { calls: 0 };   // 请求次数
function fetchUser(id) {
  return new Promise((resolve, reject) => setTimeout(() => {
    stats.calls++;
    console.log('🌐 请求用户 ' + id + '（累计 ' + stats.calls + ' 次）');
    const names = { 1: '张三', 2: '李四', 3: '王五' };
    if (names[id]) resolve({ id, name: names[id] });
    else reject(new Error('用户 ' + id + ' 不存在'));
  }, 300));
}

const queryClient = new QueryClient();

// ===== 你的代码 =====
function UserCard({ id }) {
  const { data, isPending, isError, error } = useQuery({
    queryKey: ['user', id],
    queryFn: () => fetchUser(id),
    staleTime: 60_000,
    retry: false,
  });

  if (isPending) return <p id="loading">加载中…</p>;
  if (isError) return <p id="error">出错了：{error.message}</p>;
  return <p id="user">{data.name}</p>;
}

function App() {
  const [id, setId] = useState(1);
  return (
    <QueryClientProvider client={queryClient}>
      {[1, 2, 3, 4].map(n => (
        <button key={n} data-id={n} onClick={() => setId(n)} disabled={n === id}>用户 {n}</button>
      ))}
      <UserCard id={id} />
    </QueryClientProvider>
  );
}`,
    faded: `// （QueryClient、fetchUser 和 App 与起始代码相同，这里省略）

function UserCard({ id }) {
  const { data, isPending, isError, error } = useQuery({
    /* ✏️ queryKey：缓存的名字，要包含 id */
    /* ✏️ queryFn：调用 fetchUser(id) */
    /* ✏️ staleTime：新鲜期，例如 1 分钟 */
    /* ✏️ retry：失败后不重试，错误才会立刻显示 */
  });

  if (isPending) return <p id="loading">加载中…</p>;
  /* ✏️ 出错时：显示 #error，内容包含 error.message */
  return <p id="user">{data.name}</p>;
}`,
    hint: '课文里“真库：相同的 queryKey 共享请求”的 <code>UserName</code> 组件就是这样用 <code>useQuery</code> 的。想一想：如果 key 里没有 <code>id</code>，所有用户会共用哪一条缓存？用户 4 的错误迟迟不出现，是因为真库在重试。',
    exports: ['stats'],
    test: async t => {
      const stats = t.exports.stats;
      t.assert(stats && typeof stats.calls === 'number', '找不到 stats。不要修改模拟后端');
      t.assert(/useQuery\s*\(/.test(t.source), '要在 UserCard 中调用 useQuery（步骤 2）');
      t.assert(/QueryClientProvider/.test(t.source), '不要删掉 App 里的 QueryClientProvider：useQuery 要从它拿到缓存');
      const btn = n => t.q('button[data-id="' + n + '"]');
      const shows = () => ({ loading: !!t.q('#loading'), error: t.text('#error'), user: t.text('#user') });
      await t.wait(60);
      t.assert(shows().loading && !shows().user, '首次加载用户 1 时应显示 #loading，不显示 #user（步骤 4）');
      await t.wait(450);
      t.assert(shows().user === '张三' && !shows().loading, '用户 1 加载完成后，#user 应显示“张三”，实际是“' + shows().user + '”（步骤 4）');
      t.assert(stats.calls === 1, '加载用户 1 应只请求 1 次，实际 ' + stats.calls + ' 次');

      await t.click(btn(2));
      await t.wait(30);
      t.assert(shows().user !== '张三', '切到用户 2 后还显示“张三”。queryKey 要包含 id，否则不同用户共用一条缓存（步骤 2）');
      t.assert(shows().loading, '用户 2 第一次加载时应显示 #loading');
      await t.wait(450);
      t.assert(shows().user === '李四', '用户 2 加载完成后，#user 应显示“李四”，实际是“' + shows().user + '”');
      t.assert(stats.calls === 2, '此时应共请求 2 次，实际 ' + stats.calls + ' 次');

      await t.click(btn(1));
      await t.wait(30);
      t.assert(shows().user === '张三' && !shows().loading, '切回用户 1 时应立刻显示缓存里的“张三”，不显示 #loading。数据要来自 useQuery 的缓存');
      await t.wait(450);
      t.assert(stats.calls === 2, '切回用户 1 不应再发请求，但请求次数变成了 ' + stats.calls + '。设置 staleTime（步骤 3）');
      t.assert(shows().user === '张三', '切回用户 1 后应一直显示“张三”');

      await t.click(btn(4));
      await t.wait(30);
      t.assert(shows().loading, '用户 4 第一次加载时应显示 #loading');
      await t.wait(450);
      t.assert(
        shows().error.includes('用户 4 不存在'),
        '用户 4 请求失败后，#error 应在约 0.5 秒内显示 error.message（“用户 4 不存在”），实际是“' +
          shows().error +
          '”。真库默认重试 3 次，要加 retry: false（步骤 4、5）',
      );
      t.assert(!shows().user && !shows().loading, '出错时不应显示 #user 或 #loading');
      t.assert(stats.calls === 3, '用户 4 失败后不应重试，共应请求 3 次，实际 ' + stats.calls + ' 次（步骤 5）');

      await t.click(btn(3));
      await t.wait(450);
      t.assert(shows().user === '王五' && !shows().error, '切到用户 3 后应显示“王五”，且不再显示 #error');
      t.assert(stats.calls === 4, '最后应共请求 4 次（用户 1、2、4、3 各一次），实际 ' + stats.calls + ' 次');
    },
  },
  checkOnly: [
    {
      q: `先查用户，再查这个用户的文章。第一次渲染时会怎样？<div class="codeblock faded"><pre style="white-space:pre-wrap"><code style="background:none;color:inherit;padding:0;font-size:inherit">const { data: user } = useQuery({
  queryKey: ['user', id],
  queryFn: () =&gt; getUser(id),
});
const { data: posts } = useQuery({
  queryKey: ['posts', user.id],
  queryFn: () =&gt; getPosts(user.id),
});</code></pre></div>`,
      options: ['等 user 到了，自动再查 posts', '报错：第一次渲染时 user 是 undefined，读 user.id 失败', '两个请求同时发出，都成功', 'posts 用 user 的缓存'],
      answer: 1,
      explain:
        "第一次渲染时数据还没回来，data 是 undefined。读取 user.id 会抛出 TypeError。依赖查询的写法：<code>queryKey: ['posts', user?.id]</code>，并加上 <code>enabled: !!user</code>，等 user 有值后再请求。",
    },
    {
      q: "缓存里有 <code>['todos', 'list', 1]</code>、<code>['todos', 'list', 2]</code>、<code>['todos', 'detail', 5]</code> 和 <code>['user']</code>。执行下面的代码，哪些查询会失效？<div class=\"codeblock faded\"><pre style=\"white-space:pre-wrap\"><code style=\"background:none;color:inherit;padding:0;font-size:inherit\">queryClient.invalidateQueries({ queryKey: ['todos'] });</code></pre></div>",
      options: ["一个都不会：没有查询的 key 正好等于 ['todos']", "所有以 'todos' 开头的三个查询", "只有 ['todos', 'list', 1]", '全部四个'],
      answer: 1,
      explain:
        "invalidateQueries 默认按<b>前缀</b>匹配。所有 key 以 'todos' 开头的查询都会失效，正在显示的会在后台重新请求。<code>['user']</code> 不受影响。只想匹配完全相同的 key，可以加 <code>exact: true</code>。",
    },
    {
      q: `Header 和 Sidebar 同时挂载，都调用下面的代码。会发出几次 getTodos 请求？<div class="codeblock faded"><pre style="white-space:pre-wrap"><code style="background:none;color:inherit;padding:0;font-size:inherit">const { data } = useQuery({
  queryKey: ['todos'],
  queryFn: getTodos,
});</code></pre></div>`,
      options: ['2 次：每个组件各发一次', '1 次，但第二个组件拿到的是 undefined，不会更新', '1 次', '报错：同一个 queryKey 不能用两次'],
      answer: 2,
      explain:
        'TanStack Query 按 queryKey 管理缓存。相同 key 的查询共享同一份数据和同一个请求。第一个组件发出请求后，第二个组件发现请求正在进行，就等这同一个结果。数据回来后，两个组件都会更新。所以在多个组件里直接调用同一个查询是推荐做法，不需要把数据层层传下去。“2 次”是用 useEffect 自己请求时的行为。',
    },
    {
      q: `用“界面式”乐观更新：不动缓存，只在列表末尾多渲染一行临时项。提交请求后、服务器还没响应时，这一行会怎样？<div class="codeblock faded"><pre style="white-space:pre-wrap"><code style="background:none;color:inherit;padding:0;font-size:inherit">const { mutate, variables, isPending } = useMutation({
  mutationFn: addTodo,
  onSettled: () =&gt; queryClient.invalidateQueries({ queryKey: ['todos'] }),
});

&lt;ul&gt;
  {todos.map(t =&gt; &lt;li key={t.id}&gt;{t.title}&lt;/li&gt;)}
  {isPending &amp;&amp; &lt;li style={{ opacity: 0.5 }}&gt;{variables}&lt;/li&gt;}
&lt;/ul&gt;</code></pre></div>`,
      options: [
        '不显示：缓存里还没有这条数据',
        '半透明地显示：isPending 为 true，variables 是 mutate 的参数',
        '显示成正式的一行，并且已经写进了缓存',
        '报错：variables 在 isPending 时是 undefined',
      ],
      answer: 1,
      explain:
        'mutation 在等待响应时 isPending 是 true，variables 是传给 mutate 的参数，所以临时项会半透明地显示。它只存在于这次渲染里，没有写进缓存，所以失败时不需要回滚。请求结束后 invalidateQueries 取回真数据，临时项随 isPending 变为 false 而消失。“已经写进缓存”是缓存写法（setQueryData）的行为，不是这里的。',
    },
    {
      q: `用户在筛选栏里切换分类，列表却一直不变。问题出在哪里？<div class="codeblock faded"><pre style="white-space:pre-wrap"><code style="background:none;color:inherit;padding:0;font-size:inherit">function TodoList({ filter }) {
  const { data } = useQuery({
    queryKey: ['todos'],
    queryFn: () =&gt; getTodos(filter),
  });
  // …
}</code></pre></div>`,
      options: [
        'queryFn 必须写成 async 函数',
        'queryKey 里漏了 filter：filter 变了，key 没变，Query 认为数据还是同一份',
        '需要在 useQuery 里加 refetchOnMount: true',
        'staleTime 太长，应该设为 0',
      ],
      answer: 1,
      explain:
        "缓存按 queryKey 存取，Query 只看 key 是否变化来决定要不要换一份数据。queryFn 用到的每个变量都要写进 key，这里应写成 ['todos', filter]。把 staleTime 设为 0 只会让同一个 key 更频繁地刷新，不会让 key 不同的数据分开。",
    },
    {
      q: `列表页在用户点开详情之前，先把已有的数据写进缓存。点进 <code>/users/1</code> 时，详情页会怎样？<div class="codeblock faded"><pre style="white-space:pre-wrap"><code style="background:none;color:inherit;padding:0;font-size:inherit">// 列表页（user.id 是数字 1）
queryClient.setQueryData(['user', user.id], user);

// 详情页（useParams 返回的 id 是字符串 '1'）
const { id } = useParams();
const { data } = useQuery({ queryKey: ['user', id], queryFn: () =&gt; fetchUser(id) });</code></pre></div>`,
      options: ['立刻显示缓存里的用户，不发请求', '先显示缓存，再在后台请求', '缓存不命中：显示加载中，并请求用户', '报错：两个 key 的类型不一致'],
      answer: 2,
      explain:
        "queryKey 按内容比较，数字 <code>1</code> 和字符串 <code>'1'</code> 是两个不同的 key，所以 <code>['user', 1]</code> 和 <code>['user', '1']</code> 是两份缓存。不会报错，只是白白多一次请求。修复：用 <code>Number(id)</code> 转成同一种类型。另外两点：对象里属性的顺序不影响 key（<code>{ a: 1, b: 2 }</code> 和 <code>{ b: 2, a: 1 }</code> 相同），数组里元素的顺序会影响。",
    },
    {
      q: `下面两种 <code>onSuccess</code> 的写法，区别只有花括号。表单里的按钮写了 <code>disabled={mutation.isPending}</code>。哪种写法会让按钮一直禁用，直到列表重新获取完成？<div class="codeblock faded"><pre style="white-space:pre-wrap"><code style="background:none;color:inherit;padding:0;font-size:inherit">// 写法 A
onSuccess: () =&gt; queryClient.invalidateQueries({ queryKey: ['todos'] }),

// 写法 B
onSuccess: () =&gt; { queryClient.invalidateQueries({ queryKey: ['todos'] }); },</code></pre></div>`,
      options: ['写法 B', '两种都会：invalidateQueries 总是让 mutation 等它', '写法 A', '两种都不会：isPending 只表示 mutationFn 在运行'],
      answer: 2,
      explain:
        '<code>onSuccess</code> 返回 Promise 时，mutation 会等它完成才结束。写法 A 的箭头函数把 <code>invalidateQueries</code> 返回的 Promise 交了出去，所以 <code>isPending</code> 一直是 true，直到列表重新获取完成。写法 B 加了花括号，没有 return，函数返回 undefined，<code>mutationFn</code> 一返回 mutation 就结束了。想让按钮等到列表更新，用 A；想让按钮马上恢复，用 B。',
    },
  ],
  plays: {
    '真库：useQuery 的状态字段': {
      pkey: 'tanstack-query|真库：useQuery 的状态字段',
      note: '用户 3 会失败。这个示例在 <code>QueryClient</code> 里关掉了重试（<code>retry: false</code>），所以错误立刻显示。真库默认失败后重试 3 次，间隔 1、2、4 秒，加上每次请求的 0.8 秒，约 10 秒后 <code>status</code> 才变成 <code>error</code>。',
    },
    '真库：相同的 queryKey 共享请求': {
      pkey: 'tanstack-query|真库：相同的 queryKey 共享请求',
      predict: {
        q: '页面上有三个 UserName：两个是用户 1，一个是用户 2。等它们都显示出名字，控制台里一共有几行“请求用户”？',
        options: ['3 行：每个组件各请求一次', '2 行：用户 1 一次，用户 2 一次', '1 行', '4 行：三次请求，再加一次后台刷新'],
        answer: 1,
        explain:
          "queryKey 相同的查询共享同一份缓存和同一个请求。两个 ['user', 1] 只发一次，['user', 2] 一次，共 2 行。点“再挂载一个用户 1”：名字立刻出现，控制台仍是 2 行，因为 staleTime 是 10 秒，缓存还新鲜。“3 行”是每个组件在 useEffect 里各自请求时的行为。",
      },
      note: '把 <code>staleTime: 10_000</code> 那一行删掉再运行，再点“再挂载一个用户 1”：名字仍然立刻出现，但控制台会多出一行请求。数据已经过期，新挂载的组件先显示缓存，同时在后台刷新。',
    },
    '真库：staleTime 决定重新挂载时请不请求': {
      pkey: 'tanstack-query|真库：staleTime 决定重新挂载时请不请求',
    },
    '真库：mutation 成功后不失效缓存': {
      pkey: 'tanstack-query|真库：mutation 成功后不失效缓存',
      predict: {
        q: '点一次“添加一条”，等 1 秒。列表显示几项？服务器里有几条？',
        options: [
          '列表 3 项，服务器 3 条：mutation 成功后列表自动刷新',
          '列表 2 项，服务器 3 条：缓存没有被告知数据已经变了',
          '列表 3 项，服务器 2 条：列表先显示，服务器稍后才保存',
          '列表 2 项，服务器 2 条：这次添加失败了',
        ],
        answer: 1,
        explain:
          "mutation 只负责把修改发给服务器，不会自己去动查询缓存。控制台里“POST 添加”显示服务器已经有 3 条，但 ['todos'] 缓存里还是旧的 2 条，而且 staleTime 是 Infinity，没有别的时机触发刷新。把 onSuccess 里被注释掉的那行 invalidateQueries 取消注释，列表就会自动重新请求并变成 3 项。",
      },
      note: '取消注释 <code>client.invalidateQueries(...)</code> 再运行，点“添加一条”：控制台会在 POST 之后多出一行 GET，列表变成 3 项。',
    },
    '真库：乐观更新与回滚': {
      pkey: 'tanstack-query|真库：乐观更新与回滚',
      note: '<code>onMutate</code> 返回的对象，会作为 <code>onError</code> 的第 3 个参数传回来，所以能用它把旧数据写回去。无论成功还是失败，<code>onSettled</code> 里的 <code>invalidateQueries</code> 都让列表和服务器对齐。',
    },
    '迷你 useQuery': {
      note: '对照控制台里的请求次数来观察：<ol class="task-steps"><li>两个组件请求同一数据，只发一次请求。第二个组件在 ① 处直接拿到进行中的 promise，这叫<b>请求去重</b>。</li><li>切回 5 秒内看过的用户，立刻显示，不发请求。</li><li>超过 5 秒再切回，先显示旧数据，同时在后台刷新。</li></ol>',
      predict: {
        q: '页面上有两个 User 组件同时请求用户 1。第一次加载时会发出几次请求？',
        options: ['2 次', '1 次', '0 次', '每秒一次'],
        answer: 1,
        explain: '相同的 queryKey 只会发一次请求，第二个组件直接复用进行中的那个 Promise。这就是请求去重。',
      },
      pkey: 'tanstack-query|迷你 useQuery',
    },
    'staleTime：切回标签页会不会请求': {
      pkey: 'tanstack-query|staleTime：切回标签页会不会请求',
      predict: {
        q: '等数据加载完，保持 staleTime 为 0，点一次“模拟：切到别的标签页再切回来”。接下来会怎样？',
        options: [
          '什么都不发生：缓存里已经有数据了',
          '页面变回“首次加载中…”，请求完成后显示新数据',
          '页面继续显示旧数据，同时在后台请求；请求完成后换成第 2 次请求的数据',
          '页面报错：窗口焦点事件不能触发请求',
        ],
        answer: 2,
        explain:
          'staleTime 为 0，数据一到手就算过期。窗口重新获得焦点时，过期的数据会在后台刷新：缓存先继续显示，请求完成后换成新数据。“变回加载中”混淆了“过期”和“没有缓存”。把 staleTime 改成 1 分钟再点一次，数据仍然新鲜，就不会发请求。',
      },
      note: '对照控制台和页面上的“第几次请求”：<ol class="task-steps"><li>staleTime 为 0：每次点按钮都多一次请求，旧数据一直显示，直到新数据回来。</li><li>staleTime 为 1 分钟：1 分钟内点多少次都不请求。</li></ol>',
    },
  },
} satisfies Lesson;
