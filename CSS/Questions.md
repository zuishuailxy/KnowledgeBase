# 面试题

## 布局类面试题

### 1.flex vs grid 区别：何时用 Flex，何时用 Grid？

| 特性     | Flexbox                   | Grid                       |
| -------- | ------------------------- | -------------------------- |
| 维度     | 一维度布局                | 二维布局                   |
| 方向     | 单轴布局（主轴 + 交叉轴） | 网格布局（行 + 列）        |
| 控制对象 | 子元素之间的关系          | 容器和子元素之间的二维关系 |
| 项目位置 | 顺序依赖                  | 可任意放置在网格内         |

使用 Flexbox 的场景：

1. 线性排列
2. 动态尺寸控制 需要元素自动填充可用空间
3. 控制内容对齐
4. 单方向布局

使用 grid

1. 复杂二维布局
2. 精确控制元素位置和大小 `grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));`
3. ​​ 项目位置控制 创建报纸式布局（元素跨行列） `grid-column: span 2; /* 占据两列 */`
4. ​​ 响应式重组 不同断点布局重构

```css
@media (max-width: 768px) {
  .dashboard {
    grid-template-areas:
      "header"
      "content"
      "sidebar";
  }
}
```

选择原则：​​Grid 定义大框架，Flexbox 处理内部细节 ​​

### 2. BFC(块级格式化上下文)​​：创建条件与应用场景

BFC: 浏览器的一块独立布局区域，具有独立的布局规则，与外部互不影响

简单理解：

- BFC 内部垂直排列，浮动元素计算高度
- BFC 不会被浮动元素覆盖
- BFC 内部与外部互不影响（可以避免 margin 重叠）。

创建：

- html
- float 不为 none
- overflow 不为 visible
- position 为 absolute 或 fixed
- display 为 inline-block, table-cell, flex, grid，flow-root

应用场景：

- 清除浮动（解决高度塌陷）
- 阻止外边距折叠
- 防止被浮动元素覆盖

### 3. 居中布局的多种实现 ​：

1. 水平居中：

- 行内元素 / inline-block 元素的水平居中。

```css
.parent {
  text-align: center;
}
```

- 块级元素的水平居中。

```css
.child {
  width: 200px;
  margin: 0 auto;
}
```

- Flex 实现水平垂直居中

```css
.parent {
  display: flex;
  justify-content: center;
  align-items: center;
}
```

- Grid 实现水平垂直居中

```css
.parent {
  display: grid;
  place-items: center; /* 等价于 justify-items + align-items */
}
```

- 定位 配合 transform 实现水平垂直居中

```css
.parent {
  position: relative;
}
.child {
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
}
```

- 使用 line-height（垂直居中单行文本）

```css
.parent {
  height: 100px;
  line-height: 100px;
  text-align: center;
}
```

- 使用 vertical-align

```css
.parent {
  height: 100px;
  line-height: 100px;
}
.child {
  vertical-align: middle;
}
```

### 实战总结

✅ 首选 flex / grid 完全居中（现代浏览器项目）

✅ 弹窗/模态框推荐使用 position + transform

✅ 固定宽度块水平居中用 margin: auto

✅ 文本居中 text-align: center + line-height

## 响应式类面试题

### 4. 移动端 1px 问题：原因与解决方案

#### 原因

在高分辨率（高 DPR，Device Pixel Ratio）设备（如 iPhone）上
，CSS 中写的 border: 1px solid 实际显示比预期更粗

#### 解决方案

1. 媒体查询 + transform 缩放（推荐）

```css
.border-1px {
  position: relative;
}

.border-1px::after {
  content: "";
  position: absolute;
  bottom: 0;
  left: 0;
  right: 0;
  height: 1px;
  background: #ccc;
  transform: scaleY(0.5);
  transform-origin: bottom;
}

@media (-webkit-min-device-pixel-ratio: 2), (min-resolution: 2dppx) {
  .border-1px::after {
    transform: scaleY(0.5);
  }
}

@media (-webkit-min-device-pixel-ratio: 3), (min-resolution: 3dppx) {
  .border-1px::after {
    transform: scaleY(0.333);
  }
}
```

2. border-image 方案

```css
.border-1px {
  border: 1px solid transparent;
  border-image: linear-gradient(transparent, transparent 50%, #ccc 50%, #ccc) 1;
}
```

3. box-shadow 方案

```css
.box-shadow-1px {
  box-shadow: 0 -1px 0 0 #ccc, /* 上边框 */ 1px 0 0 0 #ccc,
    /* 右边框 */ 0 1px 0 0 #ccc, /* 下边框 */ -1px 0 0 0 #ccc; /* 左边框 */
}

@media (-webkit-min-device-pixel-ratio: 2), (min-resolution: 2dppx) {
  .box-shadow-1px {
    box-shadow: 0 -0.5px 0 0 #ccc, 0.5px 0 0 0 #ccc, 0 0.5px 0 0 #ccc, -0.5px 0
        0 0 #ccc;
  }
}
```

4. SVG 背景方案
5. viewport 缩放方案
6. PostCSS 插件方案（构建时处理）

### 5.CSS 硬件加速：触发 GPU 渲染的属性详解

CSS 硬件加速通过将渲染任务交给 GPU（图形处理单元）而不是 CPU（中央处理单元）来提升页面性能

#### GPU 渲染原理

浏览器遇到特定 CSS 属性或变换，会将元素提升为合成层（Compositing Layer），由 GPU 管理。

GPU 擅长位图合成与变换（缩放、旋转、透明度变化等）。

但层数过多会占用大量内存，降低性能。

#### GPU 加速工作原理

- 创建独立的复合层（composite layer）
- 将该层的内容（位图）上传到 GPU 内存
- 由 GPU 处理该层的变换、合成和渲染
- 避免触发 CPU 密集型的主线程渲染任务

#### 能触发 GPU 加速（合成层）的常见 CSS 属性

- transform 特别是 3D 变换：translate3d(), scale3d(), rotate3d()
- opacity opacity: 0.5;
- filter filter: blur(5px);
- will-change will-change: transform, opacity;
- perspective perspective: 1000px; 设置 3D 变换的透视距离
- ​​clip-path

#### video, canvas, 3D 内容

浏览器默认以 GPU 合成渲染。

### 6. 重排(Reflow)与重绘(Repaint)优化策略

#### 重排（Reflow）

- 触发条件：元素的几何属性变化，如大小、位置、内容等。
  - 添加或删除可见的 DOM 元素
  - 元素位置或尺寸改变（包括外边距、内边距、边框、宽度、高度等）
  - 内容变化（文本改变或图片尺寸改变）
  - 页面初始渲染
  - 浏览器窗口大小改变
- 优化策略：
  - 减少 DOM 操作：批量修改 DOM，避免频繁重排。
  - 使用 CSS3 动画：利用 GPU 加速，减少重排。
  - 适当使用绝对定位：避免影响其他元素的布局。

#### 重绘（Repaint）

- 触发条件：元素的外观变化，如颜色、背景等。但不影响布局时，浏览器只需要重新绘制受影响区域的过程。
  - 颜色变化
  - 背景图片变化
  - 边框样式变化
  - 文本样式变化
  - 透明度变化
- 优化策略：
  - 减少重绘区域：只重绘变化的部分，避免全局重绘。
  - 使用合成层：将需要频繁重绘的元素提升为合成层。

#### 优化策略

1.减少 DOM 操作

```js
// 错误做法：频繁操作DOM
for (let i = 0; i < 100; i++) {
  const div = document.createElement("div");
  document.body.appendChild(div);
}

// 正确做法：使用文档片段批量操作
const fragment = document.createDocumentFragment();
for (let i = 0; i < 100; i++) {
  const div = document.createElement("div");
  fragment.appendChild(div);
}
document.body.appendChild(fragment);
```

2. 避免强制布局

```js
// 错误做法：强制同步布局（布局抖动）
const boxes = document.querySelectorAll(".box");
for (let i = 0; i < boxes.length; i++) {
  const width = boxes[i].offsetWidth; // 读取布局信息
  boxes[i].style.width = width + 10 + "px"; // 修改布局
}

// 正确做法：分离读写操作
const boxes = document.querySelectorAll(".box");
const widths = [];
// 批量读取
for (let i = 0; i < boxes.length; i++) {
  widths[i] = boxes[i].offsetWidth;
}
// 批量修改
for (let i = 0; i < boxes.length; i++) {
  boxes[i].style.width = widths[i] + 10 + "px";
}
```

3. 使用 CSS 优化

```css
/* 使用 CSS 动画替代 JS 动画 */
/* 使用 transform, opacity 等触发 GPU 加速，避免布局回流。 */
.box {
  will-change: width;
  opacity: 0.5;
}

/* 避免使用table布局 */
.table-layout {
  display: table; /* 重排开销大 */
}

/* 使用flex或grid布局 */
.modern-layout {
  display: flex; /* 重排开销小 */
}

/* 避免复杂的选择器 */
/* 错误做法 */
div.container > ul.list > li.item > a.link {
  color: blue;
}

/* 正确做法 */
.link-item {
  color: blue;
}

/* 优先使用transform和opacity */
.animate {
  /* 错误做法：触发重排 */
  left: 100px;

  /* 正确做法：只触发重绘 */
  transform: translateX(100px);
}

/* 使用will-change提前告知浏览器 */
.will-change {
  will-change: transform, opacity;
}

/* 避免使用CSS表达式 */
/* 错误做法 */
.box {
  width: expression(document.body.clientWidth > 800 ? "800px": "auto");
}
```

5. 使用虚拟 DOM 技术
6. 批量修改样式

```css
// 错误做法：多次修改样式
element.style.width = '100px';
element.style.height = '200px';
element.style.backgroundColor = 'blue';

// 正确做法1：使用cssText
element.style.cssText = 'width: 100px; height: 200px; background-color: blue;';

// 正确做法2：添加/移除class
element.classList.add('new-style');

// 正确做法3：使用requestAnimationFrame
requestAnimationFrame(() => {
  element.style.width = '100px';
  element.style.height = '200px';
  element.style.backgroundColor = 'blue';
});
```

7.使用离线 DOM 操作

```js
// 隐藏元素进行批量修改
element.style.display = "none";

// 进行大量DOM操作
for (let i = 0; i < 100; i++) {
  element.appendChild(document.createElement("div"));
}

// 显示元素
element.style.display = "block";
```

8. 避免频繁读取布局属性

```js
// 错误做法：频繁读取布局属性
function resizeElements() {
  for (let i = 0; i < elements.length; i++) {
    elements[i].style.width = container.offsetWidth / elements.length + "px";
  }
}

// 正确做法：缓存布局属性
function resizeElements() {
  const containerWidth = container.offsetWidth;
  for (let i = 0; i < elements.length; i++) {
    elements[i].style.width = containerWidth / elements.length + "px";
  }
}
```

9. 使用CSS Containment

```css
/* 限制重排范围 */
.isolated-component {
  contain: layout paint style;
  /* 
    layout: 限制内部布局不影响外部
    paint: 限制绘制范围
    style: 限制样式影响范围
  */
}
```
