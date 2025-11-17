# SSR

## 什么是SSR
<!-- 修改为表格格式 -->
|渲染方式|全称|谁来渲染 HTML|首屏速度|SEO 友好|典型代表|
|---|---|---|---|---|---|
|CSR / SPA|Client-Side Rendering|浏览器（JS）|慢（白屏）|极差|Vue CLI 默认、Create-React-App|
|SSR|Server-Side Rendering|Node.js 服务端|快|极好|Nuxt.js、Next.js|
|SSG|Static Site Generation|构建时提前生成静态 HTML|最快|极好|Nuxt static、Next.js static|
|ISR|Incremental Static Regeneration|SSG + 按需重新生成|快|极好|Next.js ISR|

核心：

页面在服务器上渲染成完整 HTML，再返回给浏览器。

## 为什么需要SSR

<!-- 修改为表格格式 -->
|场景|CSR 的问题|SSR 解决的效果|
|---|---|---|
|SEO（百度、Google）|搜索引擎抓不到内容（只抓到空壳）|直接抓到完整内容，排名正常|
|首屏加载速度|先下载一堆 JS → 执行 → 再请求数据 → 渲染|服务器直接把内容塞进 HTML，返回即显示|
|社交分享（微信、Twitter）|分享链接只有标题，没有描述和图片|有完整的 og 标签，展示卡片完美|
|低端手机 / 弱网环境 | 卡顿、白屏时间长 |内容秒出，体验接近原生|

## SSR 的两种主要模式

<!-- 修改为表格格式 -->
|模式|每次请求是否重新服务端渲染|数据实时性|服务器压力|典型场景|代表框架|
|---|---|---|---|---|---|
|SSR（传统）|是（每次请求都跑一遍）|最高|高|电商商品页、个人主页|Next.js (getServerSideProps)、Nuxt3 默认|
|SSG + ISR|构建时生成，过期后重新生成|稍有延迟|极低|博客、文档、营销页|Next.js static + revalidate、Nuxt generate|  

## SSR 的执行流程（很关键）

1. 浏览器请求 URL

2. 服务器运行 JavaScript（Vue、React 等）

3. 服务器准备数据（fetch API）

4. 在服务器上调用组件 → 生成 HTML 字符串

5. 把完整的 HTML 页面返回给浏览器

6. 浏览器显示静态内容

7. 浏览器下载前端 JS

8. 前端 JS 重新执行一遍组件 → 和服务器生成的 DOM 做 hydration（同构）

9. 🚀 页面从“静态 HTML”变成“可交互的 SPA”

整套流程被称作 同构（Isomorphic 或 Universal Rendering）
意思是：同一套代码，既能跑在服务器，也能跑在浏览器。

## SSR 的核心理念：Hydration（水合）

页面初次是服务器生成的静态 HTML。
JS 加载后，会“接管”这份 DOM，让它变成可交互的 SPA。

Hydration 的作用：

- 让按钮、表单、交互代码重新绑定事件
- 避免二次渲染覆盖 DOM
- 保证 SSR 和客户端渲染“对齐”
