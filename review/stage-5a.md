# 第五阶段（上）技术审校：typescript / router / tanstack-query / testing / nextjs

范围：`src/lessons-5.js` 第 1–642 行，以及 `src/glossary.js` 中的相关词条。
核对日期：2026-10-04。核对时的最新版本：@types/react 19.3.0、react-router 8.4.0、@tanstack/react-query 5.104.1、vitest 5.0.3、next 16.3.8。

共 13 条：错误 3 条，过时 4 条，有歧义 6 条。

---

## 错误

### 1. [错误] testing · lessons-5.js:425-443（Vitest 示例缺少 cleanup 和 jest-dom 配置）

原文：
```js
import { describe, it, expect } from 'vitest';
...
  it('初始显示 0', () => { render(<Counter />); expect(screen.getByText('计数：0')).toBeInTheDocument(); });
  it('点击 +1 后变为 1', async () => { ... await user.click(screen.getByRole('button', { name: '+1' })); ...
```
标题写着“一个完整的测试文件”，注释写着“运行：npx vitest”。

问题：
- RTL 只在测试框架**注入全局 `afterEach`** 时才自动执行 `cleanup()`。Vitest 默认 `globals: false`，所以第一个测试渲染的 Counter 会留在 document 里。第二个测试的 `getByRole('button', { name: '+1' })` 会找到 2 个按钮，抛出 “Found multiple elements”。
- `toBeInTheDocument` 来自 `@testing-library/jest-dom`，需要在 setup 文件里 `import '@testing-library/jest-dom/vitest'`。另外，测试环境要设为 `jsdom` 或 `happy-dom`。不做这些配置，文件无法“直接运行”。

来源：https://testing-library.com/docs/react-testing-library/api/#cleanup （“This is called automatically if your testing framework … injects a global afterEach()”）；https://vitest.dev/config/#globals ；https://github.com/testing-library/jest-dom#with-vitest

建议改为：在代码下方补一段配置说明。例如：“需要在 vitest.config 中设置 `environment: 'jsdom'` 和 `globals: true`。或者在 setup 文件里调用 `afterEach(cleanup)`，并 `import '@testing-library/jest-dom/vitest'`。”同时把“完整的测试文件”改为“一个测试文件（另需上述配置）”。

### 2. [错误] nextjs · lessons-5.js:609-623（Server Action 的返回值无法显示，TS 报类型错误）

原文：
```ts
export async function addComment(postId: number, formData: FormData) {
  ...
  if (!text) return { error: '评论不能为空' };
  ...
  return { ok: true };
}
<form action={addComment.bind(null, post.id)}>
```

问题：
- 直接传给 `<form action>` 的函数，返回值会被丢弃，`{ error }` 不会显示给用户。
- @types/react 把 `action` 定义为 `(formData: FormData) => void | Promise<void>`。返回对象的函数赋给它会报 TS2322（已用 tsc --strict 验证）。
- 要显示校验错误，Next.js 官方做法是：把表单拆成客户端组件，用 `useActionState`。action 的签名也要改成 `(prevState, formData)`。
- 次要问题：`actions.ts` 用到了 `db`，但没有 import。

来源：https://nextjs.org/docs/app/guides/forms#validation-errors ；@types/react `FormHTMLAttributes.action`（https://github.com/DefinitelyTyped/DefinitelyTyped/blob/master/types/react/index.d.ts）

建议改为：二选一。
- 方案 A（简单）：去掉两处 `return {...}`。空内容时直接 `return;`。
- 方案 B：保留返回值，并加一句说明：“要显示返回的错误，需要在客户端组件里用 `useActionState(addComment, null)`。此时 action 的第一个参数是 prevState。”
- 同时补上 `import { db } from '@/lib/db';`。

### 3. [错误] typescript · lessons-5.js:65（React.FormEvent 已被标为 deprecated）

原文：
```ts
function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
```

问题：当前 @types/react（19.2.x 起，最新 19.3.0）已把 `FormEvent` 和 `FormEventHandler` 标为 `@deprecated`。弃用说明是 “FormEvent doesn't actually exist”。`onSubmit` 现在的类型是 `SubmitEventHandler`。按课程原样写，编辑器会显示删除线和弃用提示。

来源：https://github.com/DefinitelyTyped/DefinitelyTyped/blob/master/types/react/index.d.ts （`interface FormEvent` 上的 `@deprecated` 注释；`onSubmit?: SubmitEventHandler<T>`）

建议改为：`function handleSubmit(e: React.SubmitEvent<HTMLFormElement>) {`。可以加注释：“旧版 @types/react 中写作 React.FormEvent”。

---

## 过时

### 4. [过时] router · lessons-5.js:158

原文：“React Router 是最常用的路由库（它的 v7 版本也是原 Remix 框架）。”

问题：
- React Router 已发布 v8（npm 最新为 8.4.0）。v8 要求 React 19.2.7+。
- v8 删除了 `react-router-dom` 包，DOM 专用 API 改从 `react-router/dom` 导入。
- 说法“v7 也是原 Remix 框架”也不严谨。准确的关系是：Remix v2 的功能并入了 React Router v7 的框架模式；Remix 3 是另一个独立项目。
- 课程代码已经从 `'react-router'` 导入，这点正确。

来源：https://reactrouter.com/upgrading/v7 ；https://remix.run/blog/react-router-v8

建议改为：“React Router 是最常用的路由库。从 v7 起，原 Remix 框架的能力并入了它的‘框架模式’。当前版本为 v8，统一从 `react-router` 包导入，不再使用 `react-router-dom`。”

### 5. [过时 / 不完整] router · lessons-5.js:286

原文：“React Router v7 的“框架模式”还提供两个功能。`loader` 在进入页面前加载数据。`action` 处理表单提交。”

问题：
- 版本号已过时，见第 4 条。
- `loader` 和 `action` 不是框架模式独有。**数据模式**（`createBrowserRouter` + `RouterProvider`）同样支持。只有课程演示的声明式模式（`<BrowserRouter>` + `<Routes>`）不支持。原文会让读者以为必须使用框架模式。

来源：https://reactrouter.com/start/modes

建议改为：“React Router 的数据模式（`createBrowserRouter`）和框架模式都支持 `loader` 和 `action`。`loader` 在进入页面前加载数据，`action` 处理表单提交。本课用的 `<BrowserRouter>` 属于声明式模式，不支持这两个功能。”

### 6. [过时] nextjs · lessons-5.js:624-630（“渲染策略”表格是旧的路由级模型）

原文：表格写着 “静态（默认尽量静态）| 构建时”，以及 “动态 | 每次请求时（读取了 cookies、headers、searchParams 等）”。

问题：
- Next.js 16 的官方文档（Caching 页面）已经以 **Cache Components**（`cacheComponents: true`）为主要模型。在这个模型下，默认渲染方式是部分预渲染（PPR）：
  - 页面的静态部分进入“静态外壳”。
  - 用 `'use cache'` + `cacheLife` 标记的数据也进入静态外壳。
  - 读取 cookies 等运行时数据的组件放在 `<Suspense>` 里，请求时再流式返回。
  - 文档原话：读取 `cookies()` “doesn't opt-in the whole route into dynamic rendering, the way the previous rendering model did”。
- 原表格描述的是“整个路由要么静态、要么动态”的旧模型（文档里称为 Previous Model）。新项目不开启 cacheComponents 时，这个旧模型仍然有效。

来源：https://nextjs.org/docs/app/getting-started/caching ；https://nextjs.org/docs/app/guides/caching-without-cache-components

建议改为：在表格下方加一条说明：“这是 Next.js 的传统模型。Next.js 16 开启 `cacheComponents` 后，同一个页面可以混合三种内容：静态内容、用 `'use cache'` 缓存的内容、在 Suspense 中按请求流式返回的内容。读取 cookies 只影响它所在的 Suspense 区域，不会让整页变成动态。”

### 7. [过时] router 和 nextjs · lessons-5.js:632

原文：“例如 React Router v7（框架模式）和 TanStack Start。”

问题：同第 4 条，当前是 v8。

建议改为：“例如 React Router（框架模式）和 TanStack Start。”去掉版本号，避免再次过时。

---

## 有歧义

### 8. [有歧义] testing · lessons-5.js:552（“反例”一词有两种理解）

原文：`q: '下面哪个是“测试实现细节”的反例？'`，答案为“断言组件内部 state.count 等于 1”。

问题：“反例”可以理解为“反面教材”，也可以理解为“counterexample”，即“不属于测试实现细节的例子”。按第二种理解，正确答案应是其他三个选项之一，和设定的答案相反。

建议改为：`'下面哪个属于“测试实现细节”（应避免的写法）？'`

### 9. [有歧义] router · lessons-5.js:193 和 274（迷你路由“API 与 React Router 一致”）

原文：“它的 API 和 React Router 一致。”标题也写着“迷你路由（API 与 React Router 一致）”。

问题：迷你版的 `<Routes routes={[...]}>` 用 `routes` 数组作 prop。真实的 `<Routes>` 接收 `<Route>` 子元素。迷你版也不支持嵌套路由、`<Outlet>` 和 `*`。直接照搬写法到 React Router 会出错。

建议改为：“`Link`、`useParams`、`useNavigate`、`useLocation` 的用法与 React Router 一致。路由表用数组传入，写法类似 `useRoutes` 和 `createBrowserRouter`。”

### 10. [有歧义] testing · lessons-5.js:547（“测试奖杯”少了一层）

原文：测试奖杯分为三层：“1. 少量单元测试 … 2. 大量集成测试 … 3. 少量端到端测试”。

问题：Kent C. Dodds 的 Testing Trophy 有四层，最底层是“静态检查”（TypeScript、ESLint）。只列三层，会和课程前面的 TypeScript 课脱节，也和原始概念不一致。

来源：https://kentcdodds.com/blog/the-testing-trophy-and-testing-classifications

建议改为：在最前面加一层：“0. 静态检查：TypeScript 和 ESLint，成本最低，覆盖最广。”

### 11. [有歧义] testing · lessons-5.js:445-450（查询优先级表）

原文：表格的优先级为 1 getByRole、2 getByLabelText、3 getByText、最后 getByTestId。

问题：官方优先级的第一组（Accessible to Everyone）共有 5 个：`getByRole`、`getByLabelText`、`getByPlaceholderText`、`getByText`、`getByDisplayValue`。第二组是 `getByAltText` 和 `getByTitle`。表格把 getByText 列为第 3，没有大问题；但省略了 AltText（图片）等常用查询，读者可能以为图片只能用 testid 查找。

来源：https://testing-library.com/docs/queries/about/#priority

建议改为：在表格下加一句：“完整顺序：Role → LabelText → PlaceholderText → Text → DisplayValue → AltText → Title → TestId。”

### 12. [有歧义] glossary.js:34 · 客户端组件定义（关联 nextjs 课）

原文：`{ term: '客户端组件', def: '用 \'use client\' 标记、在浏览器中运行的组件。' }`

问题：在 Next.js 里，客户端组件在首次加载时**也会在服务端预渲染成 HTML**，然后在浏览器中水合。“在浏览器中运行”容易让人以为它只在浏览器里运行。这样读者会误以为客户端组件里可以随意在渲染时访问 `window`。

来源：https://nextjs.org/docs/app/getting-started/server-and-client-components ；https://react.dev/reference/rsc/use-client

建议改为：“用 'use client' 标记的组件。它可以使用 state、effect 和事件；代码会发送到浏览器，首次加载时也会在服务端预渲染成 HTML。”

### 13. [有歧义] glossary.js:23 · action 一词多义（关联 router 和 nextjs 课）

原文：`{ term: 'action', def: '描述“发生了什么”的对象，例如 { type: \'added\' }。' }`

问题：术语表遵循“一词一义”原则，但 lessons-5.js:286、632 里的 action 指路由的 action 函数；nextjs 课里还有 Server Action。这两者是函数，和 reducer 的 action 对象完全不同。

建议改为：在术语表里补充 “Server Action / 路由 action：处理表单提交的函数”。也可以在 action 词条注明“仅指 reducer 中的 action 对象”，并在正文统一写成“Server Action”和“路由 action”。

---

## 已核对且正确的内容（摘要）

- **TypeScript**
  - props 的 type 写法、`?` 可选、字面量联合类型都正确。
  - `React.ComponentProps<'button'>` 正确，react.dev 推荐这种写法。
  - `React.ReactNode` 用作 children 的类型正确。
  - `useState<User | null>(null)` 和 `useRef<HTMLInputElement>(null)` 正确，与 React 19 类型兼容。
  - `React.ChangeEvent<HTMLInputElement>` 仍然有效，未被弃用。
  - 泛型组件写法正确。
  - `as const` 元组的说明正确，`(boolean | (() => void))[]` 的推断描述准确。
  - 用 `unknown` 代替 `any` 的建议正确。
  - 3 道测验的答案都正确。JSX.Element 只作为错误选项出现；@types/react 19 已移除全局 JSX 命名空间，应写 React.JSX.Element。
  - 练习的测试逻辑正确。
- **React Router**
  - 从 `'react-router'` 导入正确，v7/v8 均推荐。
  - `BrowserRouter`、`Routes`、`Route`、`index`、`path="*"`、`Outlet`、`useParams`、`useNavigate`、`useSearchParams` 的用法正确。
  - Link 与 a 标签的区别描述正确。
  - 迷你路由代码逻辑可运行。
  - 3 道测验正确。
- **TanStack Query v5**
  - 对象参数签名、`isPending`、`isFetching`、`queryKey` 数组均正确。
  - “依赖变量都写进 key”正确。
  - `useMutation({ mutationFn, onSuccess })`、`mutation.isPending`、`invalidateQueries({ queryKey })` 正确。
  - staleTime 的语义正确（默认 0）。
  - 迷你 useQuery 的去重和后台刷新逻辑与描述一致。
  - 3 道测验正确。
- **Testing**
  - `userEvent.setup()` 加 `await user.click` 是 v14 的正确写法。
  - getBy、queryBy、findBy 三种前缀的语义正确。
  - 从 `@testing-library/react` 导入 `renderHook` 和 `act` 正确。
  - 用 MSW 模拟网络、“测试行为而不是实现”的建议正确。
  - 迷你测试运行器在 React 18 下可以运行。
  - 第 1、2 题正确。
- **Next.js**
  - `npx create-next-app@latest` 正确。
  - page、layout、loading（自动包 Suspense）、error（错误边界）、not-found、route 这些约定都正确。error 文件需要 'use client'，课程未提及，不影响理解。
  - `params` 为 Promise 并需要 await 正确，Next 15 起如此。`generateMetadata` 的写法正确。
  - `notFound()`、`revalidatePath('/blog/[slug]', 'page')` 用法正确。
  - 用 `bind` 传额外参数正确，服务端组件中可以直接使用。
  - “在服务端校验权限”正确，官方文档也这样要求。
  - “不要整页 'use client'”的建议正确。
  - 3 道测验正确。
