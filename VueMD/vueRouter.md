# 原理

Vue Router 的底层实现基于浏览器 History API,核心是监听 URL 变化并渲染对应组件。

## 1. 前端路由的核心

- 传统路由由服务器根据 URL 返回不同页面。
- 前端路由的核心是 拦截浏览器默认行为，根据 URL 切换组件，而不刷新页面。

## 2. 实现方式

### hash 模式(默认)

- URL 中的 # 之后作为前端路由地址

    ```bash
    https://example.com/#/user/1
    ```

- 通过 window.onhashchange 监听变化，触发路由更新。
- 兼容性好,但 URL 不美观

### History 模式（推荐）

- 利用 HTML5 History API（pushState / replaceState）改变 URL，而不刷新页面。
- 通过 window.onpopstate 监听回退、前进事件。
- 需要服务器配置,所有路径返回 index.html

### 3.路由匹配过程

- Vue Router 内部维护一个 路由映射表（路径 → 组件）。
- 当 URL 发生变化时：
  - 解析路径，找到对应的路由规则；
  - 加载对应的组件（支持懒加载）；
  - 把组件渲染到 `<router-view>` 中。

## 动态路由守卫

路由守卫（Navigation Guards）用于在路由跳转前/后执行逻辑，例如：登录校验、权限控制。

### 1. 守卫分类

#### 全局守卫

- `router.beforeEach((to, from, next) => {})`
- `router.afterEach((to, from) => {})`

#### 路由独享守卫

- 在路由配置中：

  ```js
  {
    path: '/admin',
    component: Admin,
    beforeEnter: (to, from, next) => {
      // 权限校验
    }
  }

  ```

#### 组件内守卫

- 在组件中写：

  ```js
    export default {
      beforeRouteEnter(to, from, next) {
        // 进入前
      },
      beforeRouteUpdate(to, from, next) {
        // 复用组件时触发
      },
      beforeRouteLeave(to, from, next) {
        // 离开前
      }
    }
  ```

### 2. 动态路由（权限路由）

比如不同用户有不同权限，只能访问部分页面，这时需要 动态生成路由表。

流程示例：

1. 用户登录 → 请求后端获取权限信息。
2. 根据权限过滤路由：

    ```js
      const allRoutes = [
      { path: '/dashboard', component: Dashboard },
      { path: '/admin', component: Admin, meta: { role: 'admin' } }
    ];

    const userRole = 'user'; // 假设后端返回
    const filteredRoutes = allRoutes.filter(route => {
      return !route.meta?.role || route.meta.role === userRole;
    });

    router.addRoute(filteredRoutes);
    ```

3. 利用全局守卫限制访问：

      ```js
      router.beforeEach((to, from, next) => {
        if (to.meta.role && to.meta.role !== userRole) {
          return next('/403'); // 无权限
        }
        next();
      });

      ```

## 常见用法

### 1. 创建Router 实例

```js
// router/index.js
import { createRouter, createWebHistory } from 'vue-router';
import Home from '@/views/Home.vue';
import About from '@/views/About.vue';

const routes = [
  { path: '/', component: Home },
  { path: '/about', component: About },
];

// createWebHistory()：使用 HTML5 History API（URL 干净，无 #）
// createWebHashHistory()：使用 hash 模式（兼容性好，URL 带 #）
const router = createRouter({
  history: createWebHistory(), // 也可用 createWebHashHistory()
  routes,
});

export default router;

```

### 2. 在Vue 应用中注册

```js
import { createApp } from 'vue';
import App from './App.vue';
import router from './router';

createApp(App)
  .use(router)
  .mount('#app');
```

### 3. 使用 `<router-view>` 和 `<router-link>`

```html
<template>
  <div>
    <router-link to="/">首页</router-link>
    <router-link to="/about">关于</router-link>

    <!-- 路由出口：匹配到的组件会在这里渲染 -->
    <router-view />
  </div>
</template>

```

#### 4. 动态路由参数

```js
{
  path: '/user/:id',
  component: User
}

```

```js
// 在组件中使用
const route = useRoute();
console.log(route.params.id);
```

## 核心概念

### 1. 导航

```js
router.push('/home');       // 入栈
router.replace('/login');   // 替换当前记录
router.back();              // 后退
router.go(-1);              // 与 back() 相同
```

### 2. 命名路由

```js
{ path: '/user/:id', name: 'user', component: User }

router.push({ name: 'user', params: { id: 123 } });

```

### 3. 嵌套路由

```js

{
  path: '/user',
  component: UserLayout,
  children: [
    { path: 'profile', component: Profile },
    { path: 'posts', component: Posts },
  ],
}
```

对应模板：

```html
<router-view /> <!-- 渲染子路由 -->
```

### 4. 重定向与别名

```js
{ path: '/home', redirect: '/' }
{ path: '/start', alias: '/' }
```

## 动态路由与导航守卫

### 1. 动态添加路由

```js
router.addRoute({ path: '/user/:id', component: User })

// 也可以为某个父路由动态添加子路由：
router.addRoute('user', {
  path: 'settings',
  component: Settings,
});

```

### 2. 路由守卫（Navigation Guards）

守卫就是在路由变化时执行的钩子函数，用来实现登录验证、数据预加载、埋点等逻辑。

#### 全局前置守卫

```js
router.beforeEach((to, from, next) => {
  const isLogin = Boolean(localStorage.getItem('token'));
  if (to.meta.requiresAuth && !isLogin) {
    next('/login');
  } else {
    next();
  }
});

```

#### 全局后置守卫

```js
router.afterEach((to, from) => {
  document.title = to.meta.title || '默认标题';
});
```

#### 路由独享守卫

```js
{
  path: '/admin',
  component: Admin,
  beforeEnter: (to, from, next) => {
    // 权限校验
  }
}
```

#### 组件内守卫

```js
export default {
  beforeRouteEnter(to, from, next) {
    // 不能直接访问 this
    next(vm => {
      console.log('组件实例已创建', vm);
    });
  },
  beforeRouteUpdate(to, from, next) {
    // 当前路由复用同一个组件时触发
    next();
  },
  beforeRouteLeave(to, from, next) {
    // 离开组件时触发
    next();
  },
};

```

### 进阶机制

## 总结

- Vue Router 核心原理：利用 hash 或 history API 实现前端路由拦截与组件渲染。
- 动态路由守卫：结合全局守卫 + 路由元信息 + addRoute 实现权限路由。
