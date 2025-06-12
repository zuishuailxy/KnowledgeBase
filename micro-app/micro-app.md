# 微前端

## iframe

- 通讯麻烦

## qiankun

- 不支持 vite

## micro-app

- 不支持 vite

## EMP

- 去中心化，模块联邦，模块之间共享
- webpack 5

## 无界微前端

优点

- 接入简单
- 保活机制
- 预加载和预执行
- 支持 vite

缺点

- 隔离 js 使用空的 iframe
- 子应用 axios 需要做适配
- iframe 获取 src 是通过定时器轮询获取

底层原理：

- shadowDom 隔离 css
- iframe 隔离 js
- 通讯使用的 proxy
