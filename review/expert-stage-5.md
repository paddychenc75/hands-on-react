# 第五阶段 教学质量专家审阅（生态与实战）

范围：`src/lessons-5.js` 全部 9 课（typescript、router、tanstack-query、testing、nextjs、project-todo、project-search、project-kanban、portfolio），以及 `src/app.js` 中影响第五阶段学习的阶段测验、复习和自我解释文案。
审阅日期：2026-10-04。
已有技术审校（README.md、stage-5a.md、stage-5b-glossary.md）中的问题不再重复。本文只看**教学质量**：能不能迁移到真实工作、迷你实现会不会误导、项目和检查程序是否可靠、测验是否考推理。

尊重的设计决定：先预测再运行、课前热身、间隔复习、阶段测验 80%、帮助逐级解锁、自我解释；中文约 80% 遵循 ASD-STE100；沙箱运行 React 18.3.1，生态库用迷你版模拟。

---

## 总评

- **生态五课**：API 讲得准，但大部分是“API 导览”。真实工作里最常出问题的几件事基本没讲：
  - `fetch` 遇到 4xx/5xx 不抛错，示例又把这个坑带回来了。
  - TanStack Query 默认重试 3 次；没有讲 query key 工厂和 `keepPreviousData`。
  - SPA 深链接刷新 404；`useSearchParams` 每次输入都新增一条历史记录。
  - 测试里要包 Provider；没有 MSW 的实际写法。
  - Next.js 的“数据在哪取、缓存在哪层”没有讲。
  - 也没有讲“什么时候不该用这个库”。
- **四课中只有 TypeScript 有练习**。Router、Query、测试、Next.js 只靠 3 道选择题就算“掌握”。生态阶段最需要动手，现在反而最少。
- **三个项目**：需求表、实现约定、自动验收的形式很好，接近真实工作。问题有三个：
  - 难度没有递增。看板只写一个 reducer，代码量比异步搜索少。
  - 几乎没有整合无障碍、持久化和防抖。毕业设计却把“防抖”写成第 32 课的知识，第 32 课其实没讲。
  - 检查程序有几处“写错也能通过”和“写对反而失败”的情况，下面给出具体代码。
- **毕业设计**：方向对，但还不能直接执行。缺少：MVP 和时间预估、上线前自查清单、API 密钥安全、鉴权不要自己写、CI，以及面试时怎样讲作品。
- **测验**：约三分之一的干扰项一看就是错的（“没有区别”“新窗口”“把函数组件改成类组件”）。阶段测验又只从这些原题里抽，第五阶段 80% 的门槛偏低。

---

## 一、小而安全的修正（建议先做）

每条都只改文案、示例或断言，不改课程结构。

### 1. tanstack-query · lessons-5.js:320、394：示例重新引入了“fetch 不检查 res.ok”的坑【高】
- 问题：
  - `queryFn: () => fetch('/api/todos').then(r => r.json())` 遇到 404/500 不会进入 `isError`。上面写的 `if (isError)` 分支其实永远不会因为 HTTP 错误触发。
  - `mutationFn` 同样不检查 `res.ok`，也没有 `Content-Type` 头。服务器返回 500 时，`onSuccess` 照样执行。
- 为什么重要：第 14 课的 useFetch 已经专门修过这个坑（见 README）。到了真实库的示例又写错，学习者会以为 TanStack Query 会自动处理 HTTP 错误。这是生产中最常见的 Query bug 之一。
- 改法：

  ```js
  async function getJSON(url, init) {
    const res = await fetch(url, init);
    if (!res.ok) throw new Error('请求失败：' + res.status);  // fetch 不会自己抛错
    return res.json();
  }
  queryFn: () => getJSON('/api/todos'),
  mutationFn: (title) => getJSON('/api/todos', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ title }),
  }),
  ```

  然后加一句注释：“queryFn 必须在失败时抛错，TanStack Query 才知道请求失败了。”

### 2. tanstack-query · lessons-5.js:298：summary 承诺讲“乐观更新”，正文没讲【中】
- 问题：summary 写着“缓存、去重、后台刷新、乐观更新”，正文和测验都没有出现乐观更新。
- 为什么重要：学完自我检查时，学习者会以为自己漏看了内容。毕业设计项目三还要求“失败自动回滚”。
- 改法（二选一）：
  - 从 summary 删掉“乐观更新”。
  - 或者加一个 `deep`：在 `useMutation` 的 `onMutate` 里用 `setQueryData` 先改缓存，并返回旧值；在 `onError` 里还原；在 `onSettled` 里调用 `invalidateQueries`。再注明“React 19 的 useOptimistic 是另一种写法（第 22 课）”。

### 3. router · lessons-5.js:284：`useSearchParams` 示例有两个真实陷阱【中】
- 问题：
  - `setParams({ q, page: '1' })` 会**清掉其他查询参数**（例如 `sort`）。
  - 每输入一个字就 push 一条历史记录。用户按“后退”要退很多次。
- 改法：

  ```js
  onChange={e => setParams(prev => {
    prev.set('q', e.target.value);
    prev.set('page', '1');
    return prev;
  }, { replace: true })}   // 替换当前历史记录，不新增
  ```

  再加一句：“输入框这类高频更新用 replace，翻页这类用户想后退的操作用默认的 push。”

### 4. project-search · lessons-5.js:799 和 portfolio · lessons-5.js:1155：毕业设计要求“带防抖（第 32 课）”，第 32 课没有讲防抖【高】
- 问题：全课程只有 lessons-3.js:630 顺带提了一句 debounce。项目二直接要求“带防抖”，学习者会回去找，但找不到。
- 为什么重要：防抖是搜索框的标准做法。学习者还需要知道：**防抖减少请求次数，但不能解决竞态**。两者要一起用。这是面试高频题。
- 改法：在 project-search 的 tip 之后加一个 `deep`：

  ```js
  function useDebouncedValue(value, delay) {
    const [v, setV] = useState(value);
    useEffect(() => {
      const id = setTimeout(() => setV(value), delay);
      return () => clearTimeout(id);
    }, [value, delay]);
    return v;
  }
  ```

  然后用三句话说明：
  1. 防抖让“停止输入 300 ms 后”才发请求。
  2. 它不能保证返回顺序，所以仍然需要 ignore。
  3. 本练习的检查程序按固定时间验收，**做练习时不要加防抖**。

  同时在练习任务第 3 步之后加：“不要加防抖；检查程序按固定时间验收。”（原因见第三节第 4 条）

### 5. project-todo · lessons-5.js:737；project-kanban · lessons-5.js:978-980；project-search · lessons-5.js:878-879：参考答案缺少基础无障碍【中】
- 问题：
  - 待办的复选框没有关联的 label。读屏软件只会读“复选框，未选中”，听不到是哪一条。
  - 看板的 `←` `→` 按钮没有可访问名称，读屏软件读的是“左箭头”。
  - 搜索的加载提示和错误提示没有 `role`，读屏用户不知道结果变了。
- 为什么重要：第 29 课刚教了“getByRole 最贴近用户和读屏软件”。到了项目里，参考答案自己却不能用 `getByRole('checkbox', { name: '买牛奶' })` 找到元素。课程前后说法不一致。
- 改法（都不影响现有检查程序，检查程序靠 textContent 和类名）：
  - 待办：`<label><input type="checkbox" … /> <span>{t.text}</span></label>`。
  - 看板：`<button aria-label={'移到' + 下一列名} …>→</button>`。
  - 搜索：`<p id="loading" role="status">`、`<p id="error" role="alert">`。
  - 在需求表“实现约定”里加一列提示：“复选框要能通过文字找到（用 label 包住）”。

### 6. router · lessons-5.js:229-230：迷你 Link 自动加粗当前链接，真实的 Link 不会【低】
- 问题：迷你 `Link` 在 `path === to` 时加粗。真实 React Router 中只有 `NavLink` 这样做。学习者照搬到真实项目时，会以为 Link 也能高亮当前页。
- 改法：把迷你组件改名为 `NavLink`，或者在注释中写明：“真实库里，带高亮的是 NavLink；Link 不加样式。”

### 7. testing · lessons-5.js:488-492：迷你 getByRole 用的是标签名，不是无障碍角色【中】
- 问题：`container.querySelectorAll(role)` 把 role 当成 CSS 标签选择器。在迷你版里 `getByRole('button')` 碰巧能用，但 `getByRole('link')`、`getByRole('heading')`、`getByRole('textbox')`、`getByRole('checkbox')` 都找不到。`name` 也只比对 textContent，不支持 `aria-label` 和 `<label>`。
- 为什么重要：本课最想教的观念是“按角色找 = 按用户的感知找”。迷你实现却暗示“role 就是标签名”，学习者会写出 `getByRole('a')`、`getByRole('input')` 这类真实库里找不到元素的查询。
- 改法：加一个最小映射，并在注释里写明这是简化版：

  ```js
  const ROLE = { button: 'button', link: 'a[href]', heading: 'h1,h2,h3,h4,h5,h6',
                 textbox: 'input:not([type]),input[type=text],textarea', checkbox: 'input[type=checkbox]' };
  // name：先看 aria-label，再看文字内容（真实库还会看 <label>、alt 等）
  const nameOf = e => e.getAttribute('aria-label') ?? e.textContent;
  ```

### 8. tanstack-query · lessons-5.js:341-349：迷你 fetchQuery 失败后会永久卡住【低】
- 问题：`fn()` 失败时，`entry.promise` 一直留着已经失败的 Promise，`fetching` 一直为 true。之后同一个 key 永远不会重新请求，界面一直显示“后台刷新中…”。迷你版也没有 `isError`。
- 为什么重要：这是本课唯一能动手改的代码。学习者在模拟接口里加一个失败分支做实验，就会看到迷你版和真实库完全不同的行为。
- 改法：

  ```js
  const promise = fn().then(
    data => { cache.set(key, { data, updatedAt: Date.now() }); notify(); },
    error => { cache.set(key, { ...entry, error, fetching: false, promise: null }); notify(); }
  );
  ```

  `useQuery` 增加返回 `isError: !!(entry && entry.error)`、`error`。

### 9. app.js:705：第五阶段通过后提示“可以放心进入下一阶段了”【低】
- 问题：第五阶段是最后一个阶段。
- 改法：`si === STAGES.length - 1 ? '恭喜结业！去“毕业设计”那一课挑第一个项目开工吧。' : '可以放心进入下一阶段了。'`，并附上 `#portfolio` 链接。

---

## 二、生态五课：缺少的关键实践

### 10. 全部四门生态课 · lessons-5.js:153-644：router、tanstack-query、testing、nextjs 都没有练习，只靠 3 道选择题就算“掌握”【高】
- 问题：`maybeComplete`（app.js:477-482）规定，没有 exercise 的课答对测验就完成。这四课的 goals 都是“会配置路由”“会写测试”“能独立搭建全栈页面”。但没有任何环节检验学习者“会做”。
- 为什么重要：掌握学习只在第五阶段失效。而第五阶段恰恰最需要动手。
- 改法：利用页面上已有的迷你实现，各加一道小练习。检查程序都可以沿用现有的 `t.*` 接口。
  - **router**：在迷你路由上实现 `useSearchParams`，或实现 `*` 兜底路由。检查：点链接后地址栏和内容都正确。
  - **tanstack-query**：给迷你缓存加 `invalidate(key)`。检查：点“修改”后数据重新获取，并且请求次数 +1。
  - **testing**（最推荐）：让学习者**写测试**。检查程序先拿正确的 Counter 跑一遍，测试应全部通过；再拿 2 个有 bug 的版本（+2、重置无效）各跑一遍，测试应至少失败一次。这类练习叫“变异测试”。它能直接训练“测试要能抓住 bug”的判断。
  - **nextjs**：不能运行，可以加一道“先预测再运行”风格的判断题组。给出 6 个组件，让学习者标出哪些需要 `'use client'`，并说明原因。

### 11. testing · lessons-5.js:460-533：迷你测试运行器没有“先预测”题，错过了一道好题【中】
- 问题：正文让学习者“把 +1 改成 +2，看测试变红”，但没有先预测。实际结果很有教学价值：3 个测试里**只有 1 个失败**。第三个测试（+1 后重置）仍然通过，因为它不检查中间值。
- 改法：在 lessons-predict.js 加一条 `'testing|在浏览器里跑测试'`：
  - 题目：“把 setN(n + 1) 改成 setN(n + 2)，有几个测试会失败？”
  - 选项：3 个 / 2 个 / 1 个 / 0 个。答案：1 个。
  - 解析：“重置测试不检查中间值，所以抓不住这个 bug。一个测试只能保护它断言过的行为。”

### 12. tanstack-query · lessons-5.js:328-329、407：缺少四个日常必遇的实践点【中】
- 问题与改法：用一张“常见坑”表格补齐即可，每行一句。
  1. **默认重试 3 次**（指数退避）。接口失败后要约 7 秒才显示错误；测试里也会因此超时。要在测试的 QueryClient 里设 `retry: false`。
  2. **query key 工厂**：把 key 集中定义，例如 `userKeys = { all: ['users'], detail: id => ['users', id] }`。这样 `invalidateQueries({ queryKey: userKeys.all })` 能一次让所有用户相关缓存失效，也不会拼错 key。
  3. **翻页、搜索时不要闪回加载中**：用 `placeholderData: keepPreviousData`，换 key 时先显示上一页的数据。
  4. **依赖查询**：用 `enabled: !!userId`，等前一个数据到了再请求。
- 再补一句“何时不用它”：只在一个页面用一次、不需要缓存的请求，或者框架已经在 loader 或服务端组件里取了数据时，不必引入 Query。现有 deep（:408）已经开了头，可以合并。

### 13. project-search · lessons-5.js:799 之后：没有点明“用 Query 后竞态自动消失”【中】
- 问题：第 28 课和第 32 课没有连接起来。
- 为什么重要：这是“为什么要用库”最有说服力的例子。TanStack Query 按 queryKey 存结果，组件只读当前 key 的数据，旧请求返回后只会写进旧 key 的缓存，所以不会覆盖新结果。
- 改法：在第 32 课末尾加一个 `deep`：“用 `useQuery({ queryKey: ['users', q], … })` 重写本项目，不需要 ignore。下一个项目（毕业设计项目二）就这样做。”

### 14. router · lessons-5.js:158-191、286：缺少“选哪种模式”和三个上线必遇的问题【中】
- 问题：
  - 课程提到声明式、数据、框架三种模式，但没有告诉学习者**新项目该选哪种**。
  - 没有讲 SPA 部署到静态服务器后，**在 /users/2 刷新会 404**。
  - 没有讲受保护路由（未登录跳转）。
  - 没有讲**路由级代码分割**。毕业设计项目二要求“详情页懒加载”，本课没讲。
- 改法：
  - 加一张三行的选择表：
    - 已有的纯客户端应用 → 声明式。
    - 需要“进页面前先取数据”、需要待定状态 → 数据模式。
    - 新项目、要 SSR → 框架模式（react.dev 推荐从框架开始）。
  - 加一个 warn：“部署 SPA 时，要让服务器把所有路径都返回 index.html（Vercel 用 rewrites，Netlify 用 `_redirects`）。否则直接打开深链接会 404。”
  - 加一段代码：`const UserDetail = lazy(() => import('./UserDetail'))`，用 `<Suspense>` 包住 `<Outlet />`；未登录时 `return <Navigate to="/login" replace />`。

### 15. testing · lessons-5.js:534-548：异步测试只有一行 findBy，缺少真实项目的三件事【中】
- 问题：正文提到“用 MSW 在网络层模拟”，但没有示例。也没有讲 Provider 包装和假计时器。学习者第一次给用了 Router 或 Query 的组件写测试，就会遇到报错 “useNavigate() may be used only in the context of a <Router>”。
- 改法：加一个代码块，覆盖三件事：
  1. **MSW 2**：`setupServer(http.get('/api/users/1', () => HttpResponse.json({ name: '张三' })))`；在单个测试里用 `server.use(...)` 返回 500，测试错误界面。错误、空数据、加载中都应该有测试。这和第 32 课的四种状态直接对应。
  2. **自定义 render**：每个测试新建 `new QueryClient({ defaultOptions: { queries: { retry: false } } })`，并用 `<MemoryRouter initialEntries={['/users/1']}>` 包住被测组件。
  3. **假计时器**：测防抖时用 `vi.useFakeTimers()` 加 `userEvent.setup({ advanceTimers: vi.advanceTimersByTime })`。同时说明 `findBy` 默认最多等 1 秒。

### 16. nextjs · lessons-5.js:579-637：缺少“数据在哪取、缓存在哪层”的心智模型【中】
- 问题：技术审校已补充 cacheComponents 说明。但学习者仍然缺一个可以做决定的框架。最常见的困惑和错误是：
  - 不知道 `fetch` 默认会不会缓存。Next 15 起默认不缓存。
  - 在服务端组件里用 `fetch('/api/…')` 调用**自己的** Route Handler，多绕了一次网络。
  - 把密钥写进 `NEXT_PUBLIC_` 变量，泄露到浏览器。
  - Server Action 里直接信任 `formData`，没有校验。
- 改法：加一张“我要做 X → 用 Y”决策表：
  - 页面初始数据 → 服务端组件里直接查库。
  - 提交表单 → Server Function。
  - 给第三方或移动端提供接口 → Route Handler。
  - 客户端高频交互 → TanStack Query。

  再加 3 条 warn，每条一句：
  1. 服务端组件不要请求自己的 API 路由，直接调用数据层函数。
  2. 只能在服务端用的模块加上 `import 'server-only'`；`NEXT_PUBLIC_` 开头的变量会发到浏览器。
  3. Server Function 收到的 formData 是不可信输入，要用 Zod 这类工具做校验后再写库。
- 第 620-621 行注释提到 useActionState，可以换成 8 行的客户端表单示例：用 `useActionState` 显示错误，用 `useFormStatus` 或 `isPending` 禁用按钮。学习者在项目三马上要用。

### 17. typescript · lessons-5.js:54-99：缺少最能迁移到项目里的两种写法：可辨识联合和带类型的 Context【中】
- 问题：本课讲了 props、state、事件、泛型，但没讲两件真实项目最常用、又和后面课程直接相关的事：
  - 用可辨识联合给异步状态和 reducer action 加类型。第 32 课的 status 设计、第 33 课的 action 正好用得上。
  - Context 默认值为 null 时，怎样写一个会抛错的 `useXxx()` Hook。
- 为什么重要：可辨识联合在类型层面实现了“不可能的状态组合无法写出”，正是第 32 课测验第 2 题的观点。不讲它，TS 只像是“给变量加注解”。
- 改法：加一个代码块：

  ```ts
  type SearchState =
    | { status: 'idle' }
    | { status: 'loading' }
    | { status: 'success'; data: string[] }
    | { status: 'error'; error: Error };
  // 在 status === 'success' 的分支里，TS 才允许访问 data

  type Action =
    | { type: 'add'; title: string }
    | { type: 'move'; id: number; dir: 1 | -1 }
    | { type: 'remove'; id: number };
  ```

  再加一个测验题：“`if (s.status === 'loading') s.data` 会怎样？”答案：编译报错。
- 测验第 2 题的干扰项可以加上 `React.ReactElement`，比 `any` 更有迷惑性。

---

## 三、项目与检查程序

### 18. project-todo · lessons-5.js:760-764：“切换”只测了勾选，没测取消勾选【中】
- 写错也能通过：`const toggle = id => setTodos(todos.map(t => t.id === id ? { ...t, done: true } : t));`。它只能勾选，不能取消，但全部检查都能通过。
- 改法：在第 764 行后加：

  ```js
  await t.click(items()[1].querySelector('input[type=checkbox]'));
  t.assert(!items()[1].classList.contains('done') && left() === '剩余3项', '再次点击复选框应取消完成（需求 3）');
  await t.click(items()[1].querySelector('input[type=checkbox]'));   // 恢复，后续断言不变
  ```

### 19. project-search · lessons-5.js:891：只测了“初始为空”，没测“清空输入框”【中】
- 写错也能通过：`if (!query) return;`（不重置 state）。这是最常见的写法错误。清空输入框后，旧结果还留在屏幕上。现有检查只在一开始测了空输入，所以能通过。
- 改法：在第 899 行之后（“钱”测完以后）或最后加：

  ```js
  await t.type('#search', '');
  await t.wait(100);
  t.assert(names().length === 0 && !t.q('#empty') && !t.q('#loading'), '清空输入框后不应显示任何结果或提示（需求 2）');
  ```

### 20. project-search · lessons-5.js:892-899：加了防抖的正确答案会失败【中】
- 写对反而失败：学习者如果按真实最佳实践加 300 ms 防抖，会遇到两处失败：
  - 第 893 行“请求期间应显示 #loading”。输入后 40 ms 时请求还没发出。
  - 第 898 行的 800 ms 等待：300 + 600 = 900 ms，结果还没返回。
- 为什么重要：学习者在别处学过防抖，会因为“做得更好”而失败，又不知道原因。
- 改法：最小改动是在任务里明确写“本练习不要加防抖”（见第 4 条）。另一种做法是把等待时间都加 300 ms，并把 loading 检查改为“请求完成前任意时刻出现过即可”。第一种更简单。

### 21. project-kanban · lessons-5.js:1112-1120：只检查了 move 的不可变性；add 和 remove 修改原 state 也能通过【高】
- 写错也能通过：
  1. `case 'add': state.cards.push({ id: state.nextId, title, col: 'todo' }); return { ...state, nextId: state.nextId + 1 };`
  2. `case 'remove': state.cards.splice(state.cards.findIndex(c => c.id === action.id), 1); return { ...state };`
  3. `id: state.cards.length + 1`。删除一张卡后再添加，id 会重复，然后 `move` 会同时移动两张卡。
  4. `id: Date.now()`。reducer 不再是纯函数。
- 为什么重要：
  - 沙箱没有用 StrictMode（app.js:153），所以写法 1 在课程里表现正常。到了 Vite 项目（默认开启 StrictMode），开发环境里 reducer 会被调用两次，卡片会被加两次。
  - 本课的核心目标就是“reducer 是纯函数、可以单独测试”。检查程序却没有单独测 add 和 remove。
- 改法：在第 1120 行后加纯函数断言：

  ```js
  const snap = JSON.stringify(s0);
  const a1 = r(s0, { type: 'add', title: ' x ' });
  t.assert(JSON.stringify(s0) === snap, 'add 不能修改原来的 state');
  t.assert(a1.cards.length === 3 && a1.cards[2].title === 'x' && a1.cards[2].col === 'todo', 'add 应去掉首尾空格，并加到“待办”列');
  t.assert(a1.cards[2].id === 3 && a1.nextId === 4, '新卡片的 id 应取 nextId，并让 nextId 加 1');
  const a2 = r(r(s0, { type: 'remove', id: 1 }), { type: 'add', title: 'y' });
  t.assert(new Set(a2.cards.map(c => c.id)).size === a2.cards.length, '删除后再添加，id 不能重复');
  t.assert(JSON.stringify(s0) === snap, 'remove 不能修改原来的 state');
  t.assert(r(s0, { type: 'add', title: '  ' }) === s0, '空白标题应原样返回 state');
  ```

  另外在 deep 里加一句：“真实项目开启 StrictMode 时，React 会调用 reducer 两次，用来暴露修改原 state 的 bug。”

### 22. project-kanban · lessons-5.js:917、945-1011：难度不递增，Context 目标没有练到【中】
- 问题：
  - goals 第 2 条是“用 Context 把 dispatch 交给深层组件”，但 Context 代码全部预先写好了。
  - 学习者只写约 20 行 reducer，比实战二的 effect、竞态和四种状态更少、更简单。
  - 三个项目的工作量是“中 → 高 → 低”，不是递增。
- 改法（选一，按改动从小到大）：
  1. 把 goals 第 2 条改为“读懂 dispatch 如何通过 Context 传给深层组件”，诚实地反映练习内容。
  2. 加一个可选的“进阶挑战”（不进检查程序）：
     - 把 Provider 和 `useReducer` 封装成 `BoardProvider`，加一个 `useBoard()` Hook。Context 为空时抛错。
     - 用第 14 课的 `useLocalStorage` 思路，把 state 保存到 localStorage。
     - 这样能串起 Context、自定义 Hook、effect 和持久化四个旧知识点。
  3. 调整课序：把看板放在异步搜索之前（todo → kanban → search），并把 mins 改为 40 → 45 → 50。

### 23. typescript · lessons-5.js:141-143：类型检查靠正则，写在注释里也能通过【低】
- 写错也能通过：`type BadgeProps = { label: string; tone?: string }; // 'info' | 'success'`。注释满足第 143 行的正则。
- 为什么重要：影响不大，沙箱本来就不做类型检查。但这会让学习者以为“写对类型”是被检查过的。
- 改法：先去掉 `//…` 和 `/*…*/` 再匹配：`const src = t.source.replace(/\/\/.*$/gm, '').replace(/\/\*[\s\S]*?\*\//g, '');`。也可以在任务说明里写：“检查程序只检查写法，真正的类型检查要在编辑器里看。”

### 24. 三个项目 · lessons-5.js:652、782、914：没有一个项目要求“真实问题”中的持久化和错误恢复【低】
- 问题：持久化在待办里只是可选 tip。搜索失败后没有“重试”按钮。看板没有撤销功能。
- 改法：每个项目末尾加一行“想做得更像真的”清单（不验收）。例如：
  - 待办：持久化、双击编辑、Esc 取消编辑。
  - 搜索：重试按钮、把关键词放进 URL。
  - 看板：撤销（reducer 里保存 past 数组）、键盘移动卡片。

  这些正好成为毕业设计 README 里“遇到的最难问题”的素材。

---

## 四、毕业设计（portfolio）

### 25. portfolio · lessons-5.js:1133-1168：项目要求清晰，但缺少“怎么开始、什么时候算完成”【高】
- 问题：三个项目都只有功能清单。学习者最常卡在两个地方：
  - 不知道从哪开始，一下子写所有功能。
  - 永远觉得“还没做完”。
- 改法：每个项目加两行：
  1. **建议时长与 MVP**。例如项目一：“1 周。第一天只做‘添加一条记录并显示在列表里’，部署上线，再逐条加功能。”
  2. **完成标准（上线前自查清单）**：
     - 有可访问的线上网址。
     - `tsc --noEmit`、ESLint、测试都在 GitHub Actions 里自动跑，全部通过。
     - 加载中、空数据、出错三种状态都有界面。
     - 只用键盘能完成核心流程；Lighthouse 无障碍得分 ≥ 90。
     - README 有截图、线上链接和“最难的问题”。

### 26. portfolio · lessons-5.js:1155、1162：两处安全陷阱没有提醒【高】
- 问题：
  - 项目二用 TMDB 需要 API 密钥。Vite 里 `VITE_` 开头的环境变量**会被打包进前端代码**，任何人都能看到。
  - 项目三写着“登录注册”，没有提醒“不要自己存密码”。
- 为什么重要：初学者的公开作品集里泄露密钥、明文存密码，是面试官最快的否决理由。
- 改法：
  - 项目二加一句：“只用 TMDB 的只读令牌，并知道它会公开。需要保密的密钥，要放到服务端代理（项目三会学到）。”
  - 项目三改为：“用成熟的鉴权方案（如 Auth.js 或托管的认证服务），不要自己存储密码。每个 Server Function **和每次服务端读数据**都要检查用户身份。”后半句补上原文只说 Server Actions 的遗漏。

### 27. portfolio · lessons-5.js:1161-1167：项目三的难度跳跃太大，也没有测试要求【中】
- 问题：项目三一次引入了鉴权、数据库、ORM、部署、乐观更新五样新东西。项目一要求写测试，项目三反而没有。
- 改法：
  - 把项目三拆成两个里程碑：① 单用户、无登录，先把数据库加 Server Function 跑通并部署；② 再加登录和团队权限。
  - 加一条要求：“用 Playwright 写 1 个端到端测试：登录 → 新建卡片 → 移动 → 刷新后仍在原位。”这样第 29 课测试奖杯的第 3 层也有了练习。
  - “失败自动回滚”后面补上“并提示用户”。只回滚不提示，用户会以为操作没生效。

### 28. portfolio · lessons-5.js:1168-1171：求职准备只有 README 一条【中】
- 问题：“怎样算精通”的清单很好，但离“能拿 offer”还差两步。
- 改法：加一个小节“把作品变成面试素材”，三条：
  1. 每个项目准备一段 2 分钟讲解：解决什么问题；一个关键的设计取舍（例如“为什么收藏用 Zustand 而不是 Context”）；如果重做，你会改什么。
  2. 能现场写出三个小组件：带防抖的搜索、可访问的标签页、带 reducer 的表单。这些都对应课程里的练习，可以回到对应课程不看答案重写一遍。
  3. 给一个开源 React 项目提 1 个文档或测试相关的 PR。读别人的代码，是“读得懂官方文档每个深入探讨”之后的下一步。

### 29. lessons-4.js:700 与 portfolio · lessons-5.js:1145-1167：两份“下一步项目”不一致【低】
- 问题：第 25 课路线图写“待办应用 → 带登录的博客 → 实时协作看板”，毕业设计写“记账本 → 电影搜索 → 团队看板”。
- 改法：第 25 课改为“第五阶段有三个实战项目和一份毕业设计清单”，不再列具体项目。

---

## 五、测验

### 30. 多课 · 干扰项太弱，测的是常识，不是推理【中】
下表的干扰项不需要学过本课就能排除。第五阶段测验只抽这些题（见第 31 条），所以 80% 的门槛实际上很低。

| 位置 | 弱干扰项 | 建议替换为（保持答案位置不变） |
|---|---|---|
| :289 router Q1 | “Link 样式更好看”“没有区别” | “Link 会预先加载目标页面的全部数据”“a 标签无法携带查询参数” |
| :291 router Q3 | “页面最底部”“新窗口” | “&lt;Routes&gt; 外面的第一个 div 里”“父组件的 children prop 中” |
| :412 query Q2 | “刷新整个页面”“等用户自己刷新” | “在 onSuccess 中把 staleTime 改为 0”“在 onSuccess 中再调用一次 useQuery” |
| :642 nextjs Q3 | “为了性能”“不需要校验” | “只有页面里的 &lt;form&gt; 能调用它，所以只需在页面里校验”“中间件已经拦截了未登录用户，函数里不用再查” |
| :813-814 search | “浏览器报错”“没有影响”“没有好处” | “请求自动排队，按发出顺序显示”“React 18 会自动丢弃过期的 setState”；“减少重新渲染次数”“让 TypeScript 推断更准” |
| :942-943 kanban | “数组不能嵌套”“React 不支持”“dispatch 会变快”“可以自动保存数据” | “列数组更方便排序，所以只存 col 反而更差”；“Context 让 dispatch 不再触发重新渲染” |
| :1176-1177 portfolio | “把函数组件改成类组件”“收藏了很多文章” | “给最外层组件加 memo”“先换成 useReducer”；“能讲出每个 Hook 的源码实现” |

另外建议每课至少加 1 道**情境推理题**。例如：
- **tanstack-query**：“staleTime 是 60 秒。用户 30 秒后切回这个页面，会怎样？”
  - 选项：直接显示缓存，不发请求 / 先显示缓存，再在后台请求 / 显示加载中并重新请求 / 缓存已被删除，重新请求。
  - 答案：第 1 项。这道题能区分 staleTime 和 gcTime。
- **router**：“应用部署到静态服务器，在 /users/2 刷新后出现 404。原因是？”
- **testing**：“`getByText('张三')` 报错找不到，但页面确实会显示（数据异步加载）。应改为？”
- **kanban**：“`state.cards.push(card); return { ...state }`，界面会更新吗？隐患是什么？”
- **portfolio**：“TMDB 密钥写在 `VITE_TMDB_KEY` 里，安全吗？”

---

## 六、app.js 中影响第五阶段学习的部分

### 31. app.js:686-688：阶段测验只是原题重抽，测的是“认出”，不是“迁移”【中】
- 问题：第五阶段的题库是 9 课 × 2–3 题，共 22 题。每次抽 10 题，学习者在随堂测验和复习里已经见过每一道。选项虽然打乱，但题干和正确选项的文字不变。80% 实际上测的是“记得这道题”。
- 为什么重要：交错练习的价值在于“先判断这是哪个知识点”。原题重现会削弱这个效果。
- 改法：允许 lesson 增加一个 `checkOnly` 题组，只在阶段测验中出现。阶段测验从 `quiz` 和 `checkOnly` 合并的题库里抽。第五阶段可以先放第 30 条列出的 5 道情境题。代码改动：在 app.js:687 的 pool 构建中加上 `(l.checkOnly || [])`。`cardOf` 和 SRS 的 key 也要支持这个题组（例如 key 用 `id#c0`）。

### 32. app.js:547：项目课的自我解释提示仍是通用的“讲给朋友听”【低】
- 问题：对实战课，“它解决什么问题，怎么用”不太适用。毕业设计又要求 README 写“最难的问题和解决方法”。
- 改法：允许 lesson 自带 `selfx` 文案；项目课用：“写下这个项目里你卡得最久的一处：当时的现象、你的猜测、真正的原因、怎么修好的。”这样三份笔记直接成为 README 的素材，让练习和毕业设计接上。

### 33. app.js:516-517：“我已掌握，跳过”在项目课里会跳过唯一的综合练习【低】
- 问题：项目课的价值几乎全在练习上。跳过它们，第五阶段测验仍然可以通过。
- 改法：项目课（id 以 `project-` 开头）把按钮文字改为“我已在别处做过类似项目，跳过”，并加一句提示：“建议至少完成实战二，它考查的竞态处理在面试中很常见。”

---

## 优先级汇总

- **高**：1（fetch 不检查 res.ok）、4（防抖未讲却被引用）、10（四课无练习）、21（看板不可变性检查漏洞）、25（毕业设计无 MVP 和完成标准）、26（密钥和鉴权的安全陷阱）。
- **中**：2、3、5、7、11、12、13、14、15、16、17、18、19、20、22、27、28、30、31。
- **低**：6、8、9、23、24、29、32、33。
