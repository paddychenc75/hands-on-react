# 把 src/ 下的样式、课程内容与应用逻辑拼成一个单文件页面
import os, sys
D = os.path.dirname(os.path.abspath(__file__))
CDN = 'https://cdn.jsdelivr.net/npm/'
# 用开发版：学习者能看到完整的报错信息和 React 警告（例如缺少 key）
LIBS = ['react@18.3.1/umd/react.development.js', 'react-dom@18.3.1/umd/react-dom.development.js',
        '@babel/standalone@7.25.6/babel.min.js', 'prismjs@1.29.0/components/prism-core.min.js',
        'prismjs@1.29.0/components/prism-markup.min.js', 'prismjs@1.29.0/components/prism-clike.min.js',
        'prismjs@1.29.0/components/prism-javascript.min.js', 'prismjs@1.29.0/components/prism-jsx.min.js']
def read(n): return open(os.path.join(D, n), encoding='utf-8').read()
def build(base, out, standalone=None):
    files = ['lessons-1.js', 'lessons-2.js', 'lessons-3.js', 'lessons-4.js', 'lessons-5.js', 'lessons-predict.js',
             'lessons-6.js', 'lessons-6-escape.js', 'lessons-6-a11y.js', 'lessons-6-profiling.js',
             'lessons-6-ex-router.js', 'lessons-6-ex-query.js', 'lessons-6-ex-testing.js', 'lessons-6-ex-nextjs.js',
             *sorted(f for f in os.listdir(D) if f.startswith('lessons-7-') and f.endswith('.js')),
             'lessons-6-checks.js', 'lessons-6-order.js', 'glossary.js', 'app.js']
    # lessons-6*.js：后加的课，用 lessonAfter() 插到指定课程之后
    js = '\n'.join(read(f) for f in files if os.path.exists(os.path.join(D, f)))
    assert '</script' not in js
    scripts = '\n'.join(f'<script src="{base}{l}"></script>' for l in LIBS)
    html = f'''<title>React 从零到专家</title>
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Noto+Sans+SC:wght@400;500;700&family=Noto+Serif+SC:wght@700;900&family=JetBrains+Mono:wght@400;600&display=swap">
<style>
{read('style.css')}
</style>
<header class="topbar">
  <button class="menu-btn" id="menu-btn" type="button" aria-label="打开课程目录">☰</button>
  <a class="brand" href="#"><svg viewBox="0 0 32 32" aria-hidden="true"><g fill="none" stroke-width="1.6"><ellipse cx="16" cy="16" rx="14" ry="5.4" style="stroke:var(--accent)"/><ellipse cx="16" cy="16" rx="14" ry="5.4" transform="rotate(60 16 16)" style="stroke:var(--accent)"/><ellipse cx="16" cy="16" rx="14" ry="5.4" transform="rotate(120 16 16)" style="stroke:var(--accent)"/></g><circle cx="16" cy="16" r="2.6" style="fill:var(--accent)"/></svg><span>React 从零到专家</span></a>
  <div class="top-progress"><div class="bar"><i id="prog-bar"></i></div><span id="prog-text">已完成 0/0</span></div>
</header>
<div class="shell">
  <nav class="side" id="side" aria-label="课程目录"></nav>
  <main class="main" id="main"><div class="loading">正在加载 React 运行环境…</div></main>
</div>
<div class="toast" id="toast" role="status" aria-live="polite"></div>
<script>window.Prism = {{ manual: true }};</script>
{scripts}
<script>
{js}
</script>
'''
    # 发布时 Artifact 会自动包上 doctype 和 viewport；本地预览版自己补上，否则手机尺寸下进入怪异模式
    if standalone if standalone is not None else base != CDN:
        html = '<!doctype html>\n<meta charset="utf-8">\n<meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover">\n' + html
    open(out, 'w', encoding='utf-8').write(html)
    print(out, len(html))
# index.html：发布到 claude.ai Artifact 用（平台会补 doctype）
build(CDN, os.path.join(D, '..', 'index.html'))
# dist/react-course.html：独立网页，可直接双击打开或放到任何静态服务器
os.makedirs(os.path.join(D, '..', 'dist'), exist_ok=True)
build(CDN, os.path.join(D, '..', 'dist', 'react-course.html'), standalone=True)
# 可选：python3 build.py <库的根地址> <输出文件>，例如用本地 node_modules 离线测试
if len(sys.argv) > 1:
    build(sys.argv[1], sys.argv[2])
