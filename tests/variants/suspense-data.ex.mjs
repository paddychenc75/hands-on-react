// suspense-data 正式练习的变体。错误写法都从参考答案改出来，保证只有一处不同。
import { lessonData } from '../e2e/_site.mjs';

const L = await lessonData('suspense-data');
const sol = L.exercise.solution;
const swap = (from, to) => {
  if (!sol.includes(from)) throw new Error('参考答案里找不到：' + from);
  return sol.replace(from, to);
};

// 错误 1：请求瀑布。文章区放回 UserInfo 里面，用户信息到了才渲染文章
const waterfall = swap(
  `  return <h2 id="user">{user.name}</h2>;
}`,
  `  return (
    <div>
      <h2 id="user">{user.name}</h2>
      <ErrorBoundary resetKeys={[userId]} onRetry={() => cache.delete(postsKey(userId))}>
        <Suspense fallback={<p className="fallback">加载文章…</p>}>
          <Posts userId={userId} />
        </Suspense>
      </ErrorBoundary>
    </div>
  );
}`,
).replace(
  / {6}<ErrorBoundary resetKeys=\{\[userId\]\} onRetry=\{\(\) => cache\.delete\(postsKey\(userId\)\)\}>\n {8}<Suspense fallback=\{<p className="fallback">加载文章…<\/p>\}>\n {10}<Posts userId=\{userId\} \/>\n {8}<\/Suspense>\n {6}<\/ErrorBoundary>\n {4}<\/section>/,
  '    </section>',
);

// 错误 2：切换用户时没有用过渡更新，旧内容会被 fallback 换掉
const noTransition = swap('    startTransition(() => setUserId(id));   // 保留旧内容，直到新数据到齐', '    setUserId(id);');

// 错误 3：用户信息和文章共用一个 Suspense，用户信息要等文章
const oneBoundary = swap(
  `        <Suspense fallback={<p className="fallback">加载用户…</p>}>
          <UserInfo userId={userId} />
        </Suspense>
      </ErrorBoundary>`,
  `        <Suspense fallback={<p className="fallback">加载用户…</p>}>
          <UserInfo userId={userId} />
          <Posts userId={userId} />
        </Suspense>
      </ErrorBoundary>`,
).replace(
  / {6}<ErrorBoundary resetKeys=\{\[userId\]\} onRetry=\{\(\) => cache\.delete\(postsKey\(userId\)\)\}>\n {8}<Suspense fallback=\{<p className="fallback">加载文章…<\/p>\}>\n {10}<Posts userId=\{userId\} \/>\n {8}<\/Suspense>\n {6}<\/ErrorBoundary>\n {4}<\/section>/,
  '    </section>',
);

// 不同写法：不预取，让切换时两个边界在同一次渲染里各自发请求
const noPreload = swap('    preloadProfile(id);                     // 点击时就发出两个请求\n', '');

export default [
  { name: '参考答案', code: '$solution', expect: 'pass' },
  { name: '起始代码', code: '$starter', expect: 'fail', match: /请求|缓存|Promise/ },
  { name: '错误：请求瀑布（文章嵌在用户信息里）', code: waterfall, expect: 'fail', match: /瀑布|同时发出|独立的 Suspense/ },
  { name: '错误：切换用户没用过渡更新', code: noTransition, expect: 'fail', match: /fallback|startTransition|pending/ },
  { name: '错误：用户信息和文章共用一个 Suspense', code: oneBoundary, expect: 'fail', match: /独立的 Suspense|两个 Suspense|Suspense/ },
  { name: '不同写法：不预取，靠两个边界各自请求', code: noPreload, expect: 'pass' },
];
