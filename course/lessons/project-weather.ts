import type { Lesson } from '../types.ts';
// 非正文数据。课文在 docs/lessons/project-weather.mdx；plays 的键是示例标题（重名或无标题时是 #序号），对应 MDX 里的 ```jsx play 代码块。
export default {
  id: 'project-weather',
  stage: 4,
  title: '实战四：城市天气应用',
  mins: 40,
  summary: '在本机把 Vite、TypeScript、React Router、TanStack Query 和测试接成一个小应用：搜索城市、查看天气、收藏城市。',
  goals: [
    '能给一个应用里的每一份数据归类（URL、界面、服务器、浏览器本地），并说出各放在哪里',
    '能按“加载中、出错、没有找到、成功”四种状态写出搜索结果，并说出判断的先后顺序',
    '能用 enabled 写出依赖前一个结果的查询，并在 queryKey 里写全影响结果的参数',
    '能说出这个应用里哪些行为值得写测试，以及测试里为什么要关掉查询重试',
  ],
  keyPoints: [
    '同一份数据只放一处：搜索词放 URL，没提交的草稿放表单自己的 state，城市和天气是服务器状态交给 useQuery，收藏是浏览器里的客户端状态。加载和出错是派生数据，不再另存。',
    '渲染一个查询的顺序：先判断 isPending，再判断 isError，最后才读 data。没有匹配是正常结果（空数组），不是错误。',
    '依赖查询用 enabled 控制，不要在 queryFn 里返回 null。queryKey 里要写全所有影响结果的参数，漏掉的参数会让不同页面共用同一份缓存。',
    '不要把界面状态写进服务器数据（例如给城市对象加 fav 字段）。分开保存，切换页面、重新请求都不会互相影响。',
    '测试用户看到的行为：用假的 fetch 代替网络，每个测试用新的 QueryClient 并关掉重试，覆盖结果、空结果、错误和收藏。',
  ],
  quiz: [
    {
      q: '用户在搜索页搜索“上海”后，把浏览器地址栏里的网址发给同事，同事打开应该看到同样的结果。搜索词应该放在哪里？',
      options: [
        'SearchPage 里的 useState',
        '网址的查询参数（?q=上海），用 useSearchParams 读写',
        '放进 Context，让所有页面共享',
        '存进 localStorage，打开页面时读取',
      ],
      answer: 1,
      explain:
        '只有网址能被复制、分享，刷新和后退时也会还原。useState 和 Context 在刷新后丢失。最有迷惑性的是 localStorage：它存在用户自己的浏览器里，同事的浏览器里没有这条数据，所以同事看不到同样的结果。',
    },
    {
      q: '详情页要先按 id 取城市，再用城市的经纬度取天气。第二个 useQuery 怎样写，才能在经纬度到达之前不发出无效请求？',
      options: [
        '在 queryFn 里判断：没有城市就 return null',
        '把两个请求放进同一个 queryKey，让它们一起失效',
        '设置 enabled: city !== undefined，城市数据到了才请求',
        '用 useEffect 取到城市后，再有条件地调用 useQuery',
      ],
      answer: 2,
      explain:
        'enabled 就是为依赖查询设计的：条件不满足时，这个查询保持待定，不发请求。第一项最有迷惑性：返回 null 也会让请求“成功”，null 被缓存为结果，界面会把“没有数据”当成“有数据”。最后一项在条件里调用 Hook，违反 Hook 的调用规则。',
    },
    {
      q: '“收藏的城市”只保存在用户自己的浏览器里，不需要服务器。它属于哪一类状态，应该怎样放？',
      options: [
        '客户端状态：存进 localStorage，用 useSyncExternalStore 之类的方式读取，多个组件共享',
        '服务器状态：用 useQuery 缓存它',
        '派生数据：每次渲染时从城市对象上算出来',
        'URL 状态：写进每个页面的查询参数',
      ],
      answer: 0,
      explain:
        '收藏不来自服务器，所以不是服务器状态；它也不是由别的数据算出来的，所以不是派生数据。把它写进每个页面的网址不合适：收藏和“当前看哪个页面”无关，网址会越来越长。放在浏览器本地，再让多个组件订阅它，刷新后也还在。',
    },
    {
      q: '搜索接口对“没有匹配”的城市，返回的是 HTTP 200 和一个没有 results 字段的对象。界面应当怎样处理？',
      options: [
        '当作出错，显示“出错了”和重试按钮',
        '让查询一直保持 pending，等有数据再显示',
        '直接读 data.results.length，读不到就会自动进入 error 状态',
        '在接口层统一成空数组，界面显示“没有找到”',
      ],
      answer: 3,
      explain:
        '“没有找到”是一个正常的结果，不是错误。把接口的怪癖（缺少 results 字段）在接口层消化掉，界面只需要处理“数组是否为空”。第三项最有迷惑性：读 undefined 的 length 是抛出 TypeError，而不是让查询进入 error 状态，页面会直接崩溃。',
    },
    {
      q: '这个应用只写 3 个测试，下面哪一组最值得？',
      options: [
        '测试 useCitySearch 内部调用了一次 useQuery',
        '网址是 /?q=上海 时显示结果并链接到详情页；接口返回 500 时显示错误和重试按钮；点收藏后 localStorage 里有这个城市',
        '测试 QueryClient 的默认重试次数是 3',
        '给每个组件的渲染结果各拍一张快照',
      ],
      answer: 1,
      explain:
        '好测试描述用户看到和做的事：结果、错误、收藏。第一项和第三项测的是库的内部实现，换一种写法就会失败，却没有人受影响。快照会在任何无关的标记变化时失败，同时抓不住逻辑错误。',
    },
  ],
  exercise: {
    task: '<p>下面的应用把“是否收藏”写进了服务器返回的城市数据里。结果：切换城市后收藏丢了，切回来还会重复请求。请把<strong>服务器状态</strong>和<strong>界面状态</strong>分开。</p><ol class="task-steps"><li>不要修改“模拟的网络和数据”和“迷你版服务器状态工具”两部分。<code>useCity(id)</code> 会按 id 缓存城市数据，没有数据时返回 <code>undefined</code>。</li><li>用 <code>useCity(id)</code> 代替 <code>App</code> 里的 <code>useState</code> 加 <code>useEffect</code> 取数。</li><li>用单独的 state 保存收藏。不要把收藏写进城市数据。</li><li>收藏列表 <code>&lt;ul id="favs"&gt;</code> 里，每个已收藏的城市一个 <code>&lt;li&gt;</code>，内容是城市名。</li><li>验收：收藏不发请求；切换城市后，已收藏的城市还在列表里，每座城市的按钮状态各自正确；切回已加载过的城市不再请求。</li></ol>',
    starter: `import { useState, useEffect } from 'react';

// ===== 模拟的网络和数据（不要修改） =====
const CITIES = [
  { id: 1, name: '上海', temp: 16 },
  { id: 2, name: '北京', temp: 11 },
  { id: 3, name: '广州', temp: 24 },
];
const calls = []; // 每一次真正发出的请求，都会记在这里
function fetchCity(id) {
  calls.push(id);
  return new Promise(resolve => setTimeout(() => resolve({ ...CITIES.find(c => c.id === id) }), 150));
}

// ===== 迷你版“服务器状态”工具（不要修改） =====
const cache = new Map(); // 城市 id → 服务器返回的城市数据
const inflight = new Map();
function useCity(id) {
  const [, force] = useState(0);
  useEffect(() => {
    if (cache.has(id)) return;
    let ignore = false;
    if (!inflight.has(id)) {
      inflight.set(id, fetchCity(id).then(c => { cache.set(id, c); return c; }));
    }
    inflight.get(id).then(() => { if (!ignore) force(n => n + 1); });
    return () => { ignore = true; };
  }, [id]);
  return cache.get(id); // 数据还没到时是 undefined
}

// ===== 你的代码 =====
function App() {
  const [id, setId] = useState(1);
  const [city, setCity] = useState(null);

  useEffect(() => {
    setCity(null);
    fetchCity(id).then(c => setCity({ ...c, fav: false })); // 服务器数据里混进了“是否收藏”
  }, [id]);

  return (
    <div>
      {CITIES.map(c => (
        <button key={c.id} className="city" onClick={() => setId(c.id)}>{c.name}</button>
      ))}
      {city ? (
        <div>
          <h3 id="name">{city.name}</h3>
          <p id="temp">{city.temp}°C</p>
          <button id="fav" onClick={() => setCity({ ...city, fav: !city.fav })}>
            {city.fav ? '★ 已收藏' : '☆ 收藏'}
          </button>
        </div>
      ) : (
        <p id="loading">加载中…</p>
      )}
      <h4>收藏</h4>
      <ul id="favs"></ul>
    </div>
  );
}`,
    solution: `import { useState, useEffect } from 'react';

// ===== 模拟的网络和数据（不要修改） =====
const CITIES = [
  { id: 1, name: '上海', temp: 16 },
  { id: 2, name: '北京', temp: 11 },
  { id: 3, name: '广州', temp: 24 },
];
const calls = []; // 每一次真正发出的请求，都会记在这里
function fetchCity(id) {
  calls.push(id);
  return new Promise(resolve => setTimeout(() => resolve({ ...CITIES.find(c => c.id === id) }), 150));
}

// ===== 迷你版“服务器状态”工具（不要修改） =====
const cache = new Map(); // 城市 id → 服务器返回的城市数据
const inflight = new Map();
function useCity(id) {
  const [, force] = useState(0);
  useEffect(() => {
    if (cache.has(id)) return;
    let ignore = false;
    if (!inflight.has(id)) {
      inflight.set(id, fetchCity(id).then(c => { cache.set(id, c); return c; }));
    }
    inflight.get(id).then(() => { if (!ignore) force(n => n + 1); });
    return () => { ignore = true; };
  }, [id]);
  return cache.get(id); // 数据还没到时是 undefined
}

// ===== 你的代码 =====
function App() {
  const [id, setId] = useState(1);
  const [favs, setFavs] = useState([]); // 界面状态：收藏的城市 [{ id, name }]
  const city = useCity(id); // 服务器状态：城市数据

  const isFav = favs.some(f => f.id === id);
  function toggleFav() {
    setFavs(list => (isFav ? list.filter(f => f.id !== id) : [...list, { id, name: city.name }]));
  }

  return (
    <div>
      {CITIES.map(c => (
        <button key={c.id} className="city" onClick={() => setId(c.id)}>{c.name}</button>
      ))}
      {city ? (
        <div>
          <h3 id="name">{city.name}</h3>
          <p id="temp">{city.temp}°C</p>
          <button id="fav" onClick={toggleFav}>
            {isFav ? '★ 已收藏' : '☆ 收藏'}
          </button>
        </div>
      ) : (
        <p id="loading">加载中…</p>
      )}
      <h4>收藏</h4>
      <ul id="favs">
        {favs.map(f => <li key={f.id}>{f.name}</li>)}
      </ul>
    </div>
  );
}`,
    exports: ['calls', 'cache'],
    hint: '三步：① <code>const city = useCity(id);</code> 取代 useEffect。② <code>const [favs, setFavs] = useState([]);</code> 保存收藏，每项存 <code>{ id, name }</code>，这样列表不依赖当前显示的城市。③ 按钮根据 <code>favs</code> 里有没有当前 id 决定文字，点击时往 <code>favs</code> 里加或删。',
    faded: `// （模拟的网络、迷你工具与起始代码相同，这里省略）

function App() {
  const [id, setId] = useState(1);
  /* ✏️ 用单独的 state 保存收藏：每项是 { id, name } */
  /* ✏️ 用 useCity(id) 取城市数据，不再自己写 useEffect */

  const isFav = /* ✏️ 当前城市在不在收藏里 */;
  function toggleFav() {
    /* ✏️ 在：从收藏里去掉；不在：加上 { id, name: city.name } */
  }

  return (
    <div>
      {CITIES.map(c => (
        <button key={c.id} className="city" onClick={() => setId(c.id)}>{c.name}</button>
      ))}
      {city ? (
        <div>
          <h3 id="name">{city.name}</h3>
          <p id="temp">{city.temp}°C</p>
          <button id="fav" onClick={toggleFav}>{isFav ? '★ 已收藏' : '☆ 收藏'}</button>
        </div>
      ) : (
        <p id="loading">加载中…</p>
      )}
      <h4>收藏</h4>
      <ul id="favs">{/* ✏️ 每个收藏一个 li，内容是城市名 */}</ul>
    </div>
  );
}`,
    test: async t => {
      const { calls, cache } = t.exports;
      t.assert(Array.isArray(calls) && cache instanceof Map, '不要删除或改名 calls 和 cache：它们分别记录请求和缓存');
      const name = () => (t.q('#name') ? t.q('#name').textContent.trim() : '');
      const favText = () => (t.q('#fav') ? t.q('#fav').textContent.trim() : '');
      const favItems = () => t.qa('#favs li').map(li => li.textContent.trim());
      const cityBtn = n => t.qa('button.city')[n];

      await t.wait(500);
      t.assert(name() === '上海', '页面打开后应显示上海的数据（#name）。现在是：“' + name() + '”');
      t.assert(calls.length === 1, '第一次打开只应该请求 1 次，现在是 ' + calls.length + ' 次');

      // 收藏是界面状态：不请求，也不该写进服务器数据
      await t.click('#fav');
      await t.wait(100);
      t.assert(favText() === '★ 已收藏', '点“收藏”后，按钮应变成“★ 已收藏”');
      t.assert(calls.length === 1, '收藏只是界面状态的变化，不应该发请求。现在请求总数是 ' + calls.length);
      t.assert(favItems().length === 1 && favItems()[0].includes('上海'), '收藏后，#favs 里应该有一个 li，内容是“上海”。现在是：' + JSON.stringify(favItems()));
      t.assert(
        [...cache.values()].every(c => !('fav' in c)),
        '不要把 fav 写进服务器返回的城市数据（缓存里的对象）：收藏属于界面状态，要单独保存',
      );

      // 切到北京：北京没收藏，上海仍在列表里
      await t.click(cityBtn(1));
      await t.wait(500);
      t.assert(name() === '北京', '点“北京”后，应显示北京的数据');
      t.assert(favText() === '☆ 收藏', '北京没有被收藏，按钮应该是“☆ 收藏”');
      t.assert(favItems().length === 1 && favItems()[0].includes('上海'), '切换城市后，已收藏的上海应该还在列表里。现在是：' + JSON.stringify(favItems()));
      t.assert(calls.length === 2, '到这里应该只请求了 2 次（上海、北京），现在是 ' + calls.length);

      // 切回上海：数据在缓存里，不再请求，收藏状态还在
      await t.click(cityBtn(0));
      await t.wait(100);
      t.assert(name() === '上海', '切回上海时，应立即显示缓存的数据');
      t.assert(calls.length === 2, '切回已经加载过的城市，不应该再请求（数据在缓存里）。现在请求总数是 ' + calls.length);
      t.assert(favText() === '★ 已收藏', '切回上海，应该仍是“★ 已收藏”');

      // 取消收藏
      await t.click('#fav');
      await t.wait(100);
      t.assert(favText() === '☆ 收藏', '再点一次应取消收藏');
      t.assert(favItems().length === 0, '取消收藏后，#favs 里不应该再有上海。现在是：' + JSON.stringify(favItems()));
      t.assert(calls.length === 2, '取消收藏也不应该发请求。现在请求总数是 ' + calls.length);
    },
  },
  checkOnly: [
    {
      q: `下面是搜索结果的渲染。接口返回 500，并且重试用完之后，页面会怎样？<div class="codeblock faded"><pre style="white-space:pre-wrap"><code style="background:none;color:inherit;padding:0;font-size:inherit">const search = useCitySearch(q);
if (search.isPending) return &lt;p&gt;加载中…&lt;/p&gt;;
if (search.data.length === 0) return &lt;p&gt;没有找到&lt;/p&gt;;
if (search.isError) return &lt;QueryError error={search.error} /&gt;;
return &lt;CityList cities={search.data} /&gt;;</code></pre></div>`,
      options: ['显示 QueryError 和重试按钮', '显示“没有找到”', '读取 undefined 的 length，抛出 TypeError', '一直显示“加载中…”'],
      answer: 2,
      explain:
        '请求失败后，isPending 变成 false，data 仍是 undefined。第二个 if 先执行了 search.data.length，抛出 TypeError，根本走不到 isError 那一行。正确的顺序是：isPending、isError，最后才读 data。“显示没有找到”有迷惑性，但那要 data 是空数组才成立。',
    },
    {
      q: `详情页这样写天气查询。用户先看了上海的详情页，回到搜索页后点进北京。北京页刚打开、城市数据到达之后，天气区显示什么？<div class="codeblock faded"><pre style="white-space:pre-wrap"><code style="background:none;color:inherit;padding:0;font-size:inherit">useQuery({
  queryKey: ['forecast'],
  queryFn: ({ signal }) =&gt; getForecast(city, signal),
  enabled: city !== undefined,
  staleTime: 5 * 60_000,
});</code></pre></div>`,
      options: ['加载提示：北京还没有缓存', '报错：queryKey 里缺少城市', '空白：enabled 还是 false，不显示任何东西', '上海的天气，而且 5 分钟内不会重新请求'],
      answer: 3,
      explain:
        'queryKey 是缓存的身份证。两座城市用了同一个 ["forecast"]，北京页直接命中上海的缓存；数据在 5 分钟内算“新鲜”，所以连后台重新请求都不会发生，用户会一直看到上海的天气。修法：把城市 id 写进 queryKey，例如 ["forecast", city?.id]。',
    },
    {
      q: `收藏列表这样读取。运行时会怎样？<div class="codeblock faded"><pre style="white-space:pre-wrap"><code style="background:none;color:inherit;padding:0;font-size:inherit">const favorites = useSyncExternalStore(subscribe, () =&gt;
  JSON.parse(localStorage.getItem('favorites') ?? '[]'),
);</code></pre></div>`,
      options: [
        '正常：每次渲染都读到最新的收藏',
        'React 提示 getSnapshot 的结果应该被缓存，并且可能因为每次得到新数组而不断重新渲染，最后报“更新层数过多”',
        '只有 localStorage 里没有数据时才出错',
        '本页正常，只是别的标签页修改收藏时这里不会更新',
      ],
      answer: 1,
      explain:
        'useSyncExternalStore 用 Object.is 比较前后两次 getSnapshot 的结果。JSON.parse 每次都返回一个新数组，React 会认为“数据又变了”，于是不停地重新渲染。正确的做法：按 localStorage 里的原始字符串缓存解析结果，字符串没变就返回同一个数组。',
    },
    {
      q: `下面的测试没有设置 <code>retry: false</code>，使用 React Query 的默认设置。接口返回 500。测试会怎样？<div class="codeblock faded"><pre style="white-space:pre-wrap"><code style="background:none;color:inherit;padding:0;font-size:inherit">const client = new QueryClient();
mockFetch({ '/v1/search': new Response('boom', { status: 500 }) });
render(&lt;QueryClientProvider client={client}&gt;…&lt;/QueryClientProvider&gt;);
expect(await screen.findByRole('alert')).toBeInTheDocument();</code></pre></div>`,
      options: [
        '通过：500 会立刻让界面显示错误',
        '通过，但控制台会提示没有用 act 包裹',
        '失败：Response 对象只能被读取一次，第二次请求会抛出异常',
        '失败：查询失败后默认还会重试，而 findBy 默认只等 1 秒，等不到错误提示就超时',
      ],
      answer: 3,
      explain:
        'React Query 默认在请求失败后重试 3 次，间隔从 1 秒起。findBy 默认最多等 1 秒，错误提示还没出现，测试就超时了。所以测试里要创建新的 QueryClient 并设置 retry: false。第三项有迷惑性：这里没有读取响应体，不是失败的原因。',
    },
  ],
  plays: {
    'URL 才是搜索词的唯一数据源': {
      note: '输入框把网址里的 q 复制进了自己的 state，只在第一次渲染时用它。之后网址变成“北京”，输入框还是“上海”：两份数据各管各的，就会不一致。结果列表直接读网址，所以永远是对的。本机项目里的做法是给 SearchForm 加 key={q}，q 变了，表单重新挂载，草稿重新从网址初始化。',
      predict: {
        q: '运行后，点一次“搜索“北京””按钮。这时输入框里的文字和“结果列表显示”的那一行，分别是什么？',
        options: ['输入框：北京；结果：北京', '输入框：上海；结果：北京', '输入框：北京；结果：上海', '输入框：上海；结果：上海'],
        answer: 1,
        explain: '输入框的 state 只在第一次渲染时用网址里的 q 初始化，网址后来变了它也不会跟着变，所以还是“上海”。结果列表直接读网址，所以是“北京”。',
      },
      pkey: 'project-weather|URL 才是搜索词的唯一数据源',
    },
    '加载、出错、没有找到、成功：四种状态': {
      note: '“火星”没有结果，接口返回空数组，界面显示“没有找到”：这是正常结果，不是错误。“错误”请求失败，界面显示错误和重试按钮。这个模拟接口对“错误”永远失败，所以点“重试”会再次出错；真实项目里重试是为网络恢复后用的。判断的顺序是先 pending，再 error，最后才读 data。本机项目里这些状态由 useQuery 提供，顺序要你自己写对。',
    },
    '服务器缓存与收藏：互不干扰': {
      note: '页面一打开就请求了上海（1 条），点“北京”请求北京（2 条）。点回“上海”时，上海的数据在缓存里，不再请求。点“收藏”只改了界面状态，也没有请求。服务器状态按 id 缓存，收藏单独保存，两者互不影响。',
      predict: {
        q: '页面一打开就加载了上海。依次点“北京”“上海”“收藏”之后，“请求记录”那一行里一共有几条？',
        options: ['1 条', '3 条', '2 条', '4 条'],
        answer: 2,
        explain: '请求记录是：请求 上海（页面打开）、请求 北京。切回上海用缓存，不请求；点“收藏”只改界面状态，不请求。一共 2 条。',
      },
      pkey: 'project-weather|服务器缓存与收藏：互不干扰',
    },
  },
} satisfies Lesson;
