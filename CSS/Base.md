# CSS BASE

## 层叠，优先级，继承

样式表层叠 - css 规则的顺序很重要

优先级

- 选择器不是很具体，优先级低
- 选择器越具体，优先级高点

继承

父元素上的 css 属性可以被子元素继承

### 计算优先级

三个不同的值（或分量）相加

- 百（ID）
- 十（类）
- 个（元素）
- 内联式 对应 千

备注：每一个选择器类编都有它自己的优先级等级，它们不会被具有较低优先级的选择器覆盖。例如，权重为一百万的类选择器不会覆盖权重为一的 ID 选择器

### 继承

父元素的样式，可以被子元素继承

- inherit 开启继承
- initial 设计为初始值
- revert 重置为浏览器的默认样式
- revert-layer 重置为在上一个层叠层中建立的值
- unset 属性重置为自然值

### 层叠

1. 资源顺序：相同权重，后面的覆盖前面的样式
2. 优先级： 选择器的优先级不同
3. 重要程度

## 常见的选择器

### 属性选择器：一个元素自身是否存在或者各式按属性值的匹配，来选取元素

- [attr] -> a[title]
- [attr=value] -> a[href="http..."]
- [attr~=value] -> p[class=~"title"]
- [attr|=value] -> div[lang|="zh"]

### 子字符串匹配

- [attr^=value] -> li[class="box-"] 以什么开头
- [attr$=value] -> li[class="-box"] 以什么结尾
- [attr*=value] -> li[class="-box-"] 至少出现了一次 value

```css
/* 注意： 大小不敏感可以传入 i */
li[class^="a" i] {
  color: red;
}
```

### 伪类：选择处于特定状态的元素

- 以`:`开始， ex: `:invalid`

### 伪元素：表现得是像你往标记文本中加入全新的 HTML 元素一样，而不是向现有的元素上应用类

- `::`开头 ex:`::before`

注意：

`::before` 和 `::after` 不要用来生产文本，但是可以用来生产图标等

### 关系选择器

- 后代选择器: 单个空格
- 子代关系选择器： > 只会在选择器中选中直接子元素的时候匹配
- 邻接兄弟： + 选中恰好处于另一个继承关系上同级的元素旁边的物件
- 通用兄弟： ~ 选中一个元素的兄弟元素，即使部门不直接相邻

## 盒模型

### 区块盒子：h1, p , div ; block

- 盒子会换行
- width 和 height 属性生效
- 内边距和外边距和边框会将其他元素推开

### 行内盒子: a, span, em; inline

- 盒子不会换行
- width 和 height 不生效
- 垂直方向的内边距、外边距以及边框会被应用但是不会把其他处于 inline 状态的盒子推开。
- 水平方向的内边距、外边距以及边框会被应用且会把其他处于 inline 状态的盒子推开。

### CSS 盒模型

一 标准盒模型 `box-sizing: content-box`

- 内容：显示内容的大小；使用 inline-size 和 block-size 或 width 和 height 等属性确定其大小。
- 内边距：内容周围的空白： padding
- border: 边框 border
- 外边距盒子：外边距 margin

二 替代盒模型 `box-sizing: border-box`

- 任何宽度都是页面上可见方框的宽度。

### 背景和边框

background:

- background-color
- background-img
- background-repeat
- background-size: cover / contain
- background-position : x y
- background-attachment: 内容滚动时的滚动方式

border:

- border-width: 1px;
- border-style: solid;
- border-color: black;
- border-radius

### 字体

- font-family: 字体系列
- font-size: 字体大小
- font-weight: 字体粗细
- font-style: 字体样式
- line-height: 行高
- text-transform: 大小写转换
- text-shadow: 4px 4px 5px red (阴影与原始文本的水平偏移, 垂直偏移, 模糊半径, 颜色)

### 列表中

- start
- value
- reverse

```html
<ol start="4" reversed>
  <li>Toast pita, leave to cool, then slice down the edge.</li>
  <li value="2">
    Fry the halloumi in a shallow, non-stick pan, until browned on both sides.
  </li>
  <li>Wash and chop the salad.</li>
  <li>Fill pita with salad, hummus, and fried halloumi.</li>
</ol>
```

## 布局

### 浮动 float

- 浮动元素会脱离正常的文档布局流
- 吸附到父容器内的左边，或者右边
- 浮动元素之下的内容，会环绕在浮动元素的周围

清除浮动

- clear: both; 清除左右浮动

"clearfix 小技巧"：先向包含浮动内容及其本身的盒子后方插入一些生成的内容，并将生成的内容清除浮动

```css
.wrapper::after {
  content: "";
  clear: both;
  display: block;
}

.wrapper {
  overflow: auto; /* 另一种清除浮动的方法 */ 只要值不为visible 就可以
}

.wrapper {
  display: flow-root; /* 现代的方案 */
}
```

### 定位

正常的布局流:

- 块级元素在视口中垂直布局，外边距将他们分开
- 内联元素不会出现在新行，而是水平布局，外边距不会影响其他内联元素

注意 区块的上下外边距会合并为单个边距，其大小为两个边距中的最大值。(外边距折叠)

定位：

- static：默认行为；正常文档流；不脱离文档流；无层叠上下文
- relative：自身的初始位置；不脱离文档流，保留位置；微调元素位置；创建层叠上下文
- absolute：最近的非 static 定位祖先；脱离文档流；不保留位置；常用于弹出层；创建层叠上下文
- fixed: 浏览器的视口；脱离文档流；不保留位置；固定导航栏；创建层叠上下文
- sticky: relative 和 fixed 的结合；最近滚动容器 & 视口；动态脱离；表头；创建层叠上下文

### Flex

两个轴：

- 主轴：flex 元素放置的的方向延伸的轴，开始和结束 main start 和 main end
- 交叉轴 垂直于主轴方向的轴，开始和结束称为 cross start 和 cross end

常见属性：

- flex-direction：指定主轴的方向
- flex-wrap: 换行
- flex-flow: flex-direction 和 flex-wrap 的缩写 row wrap
- flex：1。 每个元素占用的空间都是相等，占用的空间是设置 padding 和 margin 之后的剩余空间
- flex: flex-grow :增长系数，flex-shrink: 缩小
- flex-shrink：在默认宽度之和大于容器的时候才会发生收缩，其收缩的大小是依据 flex-shrink 的值。从每个 flex 项中取出多少溢出量，以阻止它们溢出它们的容器。
- flex-basis：最小值
- justify-content: 控制 flex 项在主轴方向的位置；space-between：让所有的 flex 项在主轴均匀地分布，它不会在两端留下任何空间；space-around：均匀分布，但是两端会留下空间。space-evenly: 子项与子项之间以及子项与容器边界之间的距离完全相等
- order：排序

### grid

由一系列水平和垂直的线构成的一种布局模式。一个网格通常有很多列或者行构成，行与行，列与列之间的间距称为沟槽。

重要的属性：

- grid-template-columns / rows: 设置元素在列上的分布。1fr 对应网格容器中可用空间的一份;可以使用 repeat 重复构建
- gap: column-gap:列间隙；row-gap:行间歇
- grid-auto-columns / rows: 自动生成的列或行的大小,一般是 auto, 可以手动指定
- minmax 函数：minmax(100px, auto)：至少为 100px，最大为自动计算的大小
- grid-columns/rows: 据这些分隔线来放置元素; 是 grid-columns-start 和 grid-columns-end 的缩写; 可以通过 -1 定位到最后一条显式网络的分割线
- grid-template-areas: 用来定义网格区域的名称; 可以通过 grid-area 来引用

注意： 网格排版框架一般由 12 到 16 列的网格构成

### 响应式设计

- 媒体查询
- 现代布局：flex / grid
- 响应式图片
- 响应式排版：利用视口单位 vw vh 等

### 媒体查询

```css
@media media-type and (media-feature-rule) {
  /* CSS rules go here */
}
```

- 媒体类型：all / print / screen / speech
- 媒体特征规则： 高 宽 方向 orientation hover
- 或 逻辑： 用 ， 链接
- 非逻辑：用 not

### CSS 动画

分为 transition 和 animation：

transition：可以为一个元素在不同状态间切换的时候定义不同的过渡效果

- transition-property：属性值
- \*-delay：延迟时间
- \*-timing-function：时间函数
- \*-duration：持续时间

```css
/* property name | duration | timing function | delay */
transition: margin-right 4s ease-in-out 1s;
```

注意：

- 可以使用 will-change 优化性能
- 尽量在设置 property 的时候不要使用 all
- 使用 transform: translateZ(0)开启 GPU 加速

animation：可以定义一个复杂动画

- \*-name： 通过 @keyframes 来定义动画名字
- animation-duration：持续时间
- animation-timing-function：时间函数
- animation-delay：延迟时间
- animation-iteration-count：动画运行的次数
- animation-direction：动画的方向 normal / reverse / alternate / alternate-reverse
- animation-fill-mode：动画运行之后如何将样式应用于目标 none / forward / backward / both
- animation-play-state：动画是否暂定 pause / running

时间函数：

- 线性：使用的是三次贝塞尔函数，预设值 linear ease ease-in ease-out ease-in-out
- 非线性： steps(1, start|end)

js 实现动画：

- animationstart
- animationend，transitionend
- animationiteration

## 浏览器渲染原理

- html 文件会被解析成 html DOM 树
- CSS 文件会被解析成 CSSOM 树
- 两者合并生成 render tree
- render tree 确定布局
- 根据布局的结果，拆分为多个图层，渲染像素
- 合成多个图层，生成图像

渲染的时候从父节点再到子节点，而且渲染的时候每个元素的所有的 CSS 属性值必须有值

如何确定 css 属性值

1. 样式声明：样式表-包括自己的写的 css 样式以及浏览器的默认样式
2. 计算层叠（权重问题）
   - 比较重要性：自己写的样式 > 浏览器默认样式
   - 比较特殊性：计算选择器权重值
   - 比较源次性：权重一致的时候，后来者居上
3. 如果可以从父元素那里继承，则继承
4. 赋予默认值

那些属性可以继承：

- 文本相关的属性： 字体属性 / 文本属性
- 表格相关的属性： 例如：border-collapse: collapse;
- 其他可继承属性: color, visibility, cursor, quotes

## 核心概念

### BFC

black format context 块级格式化上下文：就是一个独立的布局环境，会影响布局，并隔绝元素。

如何创建：

```css
/* 1. 根元素（<html>） */
html {
}

/* 2. 浮动元素（float 不为 none） */
.float-element {
  float: left; /* 或 right */
}

/* 3. 绝对定位元素（position 为 absolute/fixed） */
.abs-element {
  position: absolute;
}

/* 4. display 为特定值 */
.inline-block {
  display: inline-block;
}
.table-cell {
  display: table-cell;
}
.table-caption {
  display: table-caption;
}
.flex-container {
  display: flex;
}
.grid-container {
  display: grid;
}
.inline-flex {
  display: inline-flex;
}
.inline-grid {
  display: inline-grid;
}

/* 5. overflow 不为 visible */
.overflow-hidden {
  overflow: hidden;
}
.overflow-auto {
  overflow: auto;
}
.overflow-scroll {
  overflow: scroll;
}

/* 6. 新增的现代方法 */
.flow-root {
  display: flow-root; /* 专门创建 BFC 的属性 */
}

/* 7. contain 属性 */
.contain-layout {
  contain: layout; /* 或 content/strict */
}
```

特性：

1. 解决 margin 塌陷问题
2. 高度塌陷
3. 阻止元素被浮动元素覆盖

适用场景：

1. 解决 margin 塌陷
2. 清除浮动
3. 创建 自适应双栏布局，左边浮动，右边清除浮动

```html
<div class="container">
  <div class="sidebar">侧边栏</div>
  <div class="main-content">主内容</div>
</div>
```

```css
.sidebar {
  float: left;
  width: 200px;
}

.main-content {
  overflow: hidden; /* 创建 BFC */
  /* 自动填满剩余空间 */
}
```

4. 阻止文字环绕

```html
<!-- 图片左浮动 -->
<div class="float-img">
  <img src="photo.jpg" alt="示例图片" />
</div>
<p class="text-content">这里是文本内容...</p>
```

```css
.text-content {
  overflow: hidden; /* 创建 BFC */
  /* 文本不再环绕图片 */
}
```

### margin 塌陷

​​ 当两个或多个垂直相邻的块级元素的外边距相遇时，它们会合并为一个外边距，取其中较大的值 ​​。

塌陷发生条件：

1. 垂直方向外边距不会合并
2. 父元素和第一个/最后一个子元素之间
3. 空块元素本身

解决塌陷的 8 个方法

- 从 padding 代替
- 用 1px 透明边框
- 创建 BFC
- 使用伪元素
- 添加最小高度间隔
- 使用 flex / grid
- 添加内联元素间隔
- 绝对定位间隔

# 响应式设计

响应式设计是指通过使用灵活的布局、图像和 CSS 媒体查询来创建能够适应不同屏幕尺寸和设备的网页设计。

### 关键技术

1. **流式布局**：使用百分比而不是固定单位（如 px）来定义元素的宽度和高度，使其能够根据视口大小自动调整。

2. **媒体查询**：使用 CSS 媒体查询来应用不同的样式规则，以适应不同的设备特性（如屏幕宽度、高度、方向等）。

   ```css
   @media (max-width: 600px) {
     /* 针对小屏幕的样式 */
   }
   ```

3. **弹性盒子（Flexbox）**：使用 Flexbox 布局来创建灵活的响应式布局，能够轻松地在不同屏幕尺寸下调整元素的排列和大小。

   ```css
   .container {
     display: flex;
     flex-wrap: wrap;
   }
   ```

4. **CSS 网格（Grid）**：使用 CSS Grid 布局来创建复杂的响应式网格布局，能够在不同屏幕尺寸下灵活地调整行和列。

   ```css
   .grid-container {
     display: grid;
     grid-template-columns: repeat(auto-fill, minmax(200px, 1fr));
   }
   ```

5. **响应式图片**：

- 使用 `srcset` 和 `sizes` 属性来提供不同分辨率的图像，以适应不同设备的屏幕尺寸和分辨率。

```html
<img
  src="image.jpg"
  srcset="image-600.jpg 600w, image-1200.jpg 1200w"
  sizes="(max-width: 600px) 100vw, 50vw"
  alt="示例图片"
/>
```

- 利用 `picture` 元素和 `source` 元素来提供不同的图像格式和分辨率，以适应不同设备的屏幕尺寸和分辨率。

```html
<picture>
  <!-- 小屏幕：方形裁剪 -->
  <source
    media="(max-width: 600px)"
    srcset="square-small.jpg 1x, square-large.jpg 2x"
  />

  <!-- 中等屏幕：横向裁剪 -->
  <source
    media="(max-width: 1200px)"
    srcset="landscape-medium.jpg 800w, landscape-large.jpg 1600w"
    sizes="(max-width: 900px) 100vw, 
           75vw"
  />

  <!-- 默认：完整图片 -->
  <img
    src="full-image.jpg"
    srcset="full-image.jpg 1200w, full-image-hd.jpg 2400w"
    alt="艺术指导响应式图片"
    loading="lazy"
  />
</picture>
```

- 使用 CSS 的响应式背景图片。

```css
.hero-banner {
  width: 100%;
  height: 0;
  padding-top: 56.25%; /* 16:9 宽高比 */
  background-size: cover;
  background-position: center;

  /* 移动设备 */
  background-image: url("mobile-bg.jpg");

  /* 平板设备 */
  @media (min-width: 768px) {
    background-image: url("tablet-bg.jpg");
  }

  /* 桌面设备 */
  @media (min-width: 1200px) {
    background-image: url("desktop-bg.jpg");
  }

  /* 高分辨率设备 */
  @media (-webkit-min-device-pixel-ratio: 2), (min-resolution: 192dpi) {
    background-image: url("desktop-bg@2x.jpg");
  }
}
```

- 现代图片格式优化 webP + AVIF + JPEG 回退方案

```html
<picture>
  <!-- AVIF格式 (最高效) -->
  <source type="image/avif" srcset="image.avif 1x, image@2x.avif 2x" />

  <!-- WebP格式 (广泛支持) -->
  <source type="image/webp" srcset="image.webp 1x, image@2x.webp 2x" />

  <!-- 传统JPEG回退 -->
  <img
    src="image.jpg"
    srcset="image.jpg 1x, image@2x.jpg 2x"
    alt="现代图片格式示例"
    loading="lazy"
  />
</picture>
```

### 实践建议

- **移动优先**：从小屏幕开始设计，然后逐步添加样式以适应更大的屏幕。
- **测试**：在不同设备和屏幕尺寸上测试设计，以确保良好的用户体验。
- **性能优化**：使用适当的图像格式和压缩技术，以提高加载速度和性能。

## 响应式图片的最佳实践

### 1. 懒加载技术

```html
<img
  src="placeholder.jpg"
  data-src="image.jpg"
  data-srcset="image.jpg 400w, 
              image@2x.jpg 800w"
  alt="懒加载图片"
  loading="lazy"
  class="lazyload"
/>

<script>
  // 使用Intersection Observer实现懒加载
  document.addEventListener("DOMContentLoaded", () => {
    const lazyImages = document.querySelectorAll(".lazyload");

    const observer = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          const img = entry.target;
          img.src = img.dataset.src;
          if (img.dataset.srcset) {
            img.srcset = img.dataset.srcset;
          }
          observer.unobserve(img);
        }
      });
    });

    lazyImages.forEach((img) => observer.observe(img));
  });
</script>
```

### 2. 自适应宽高比容器

```html
<div class="aspect-ratio-box">
  <img src="image.jpg" alt="示例图片" />
</div>
```

```css
.aspect-ratio-box {
  position: relative;
  width: 100%;
  padding-top: 56.25%; /* 16:9 宽高比 */
  overflow: hidden;
}

.aspect-ratio-box img {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  object-fit: cover; /* 或 contain */
}
```

### 3. CDN 图片优化服务

使用专业 CDN 服务自动优化图片：

### 4. 性能优化技巧

```html
<!-- 预加载关键图片 -->
<link rel="preload" href="hero-image.jpg" as="image" />

<!-- 使用低质量图片占位符 (LQIP) -->
<img
  src="image-lqip.jpg"
  data-src="image.jpg"
  data-srcset="image.jpg 800w, image@2x.jpg 1600w"
  class="lazyload blur-up"
/>

<style>
  .blur-up {
    filter: blur(5px);
    transition: filter 0.4s ease;
  }

  .blur-up.lazyloaded {
    filter: blur(0);
  }
</style>
```

## 容器查询

允许组件根据 ​​ 父容器尺寸 ​​ 而非全局视口自适应样式，实现真正的组件级响应式设计。

### 语法

```css
@container (min-width: 500px) {
  .card {
    display: grid; /* 宽容器中切换为网格布局 */
    grid-template-columns: 1fr 2fr;
  }
}
```

如果要指定特殊的容器

```css
.sidebar {
  container-name: sidebar;
  container-type: inline-size; // inline-size：基于容器宽度响应（最常用）, size：同时响应宽高
  /* 简写：container: <name> / <type> */
}
@container sidebar (min-width: 300px) {
  ...;
} /* 仅作用于.sidebar容器 */
```

### 核心运用

1. 组件库开发
2. 嵌套布局优化
3. 动态主题优化

### 进阶技巧

1. ​​ 容器单位 ​​

   使用相对单位实现精细控制：

   - cqi：容器宽度的 1%（水平方向）
   - cqb：容器高度的 1%（垂直方向）

2. 性能优化 ​​

   对频繁变化的容器添加 contain: layout inline-size，限制浏览器重排/重绘范围

3. 嵌套容器查询

多层容器独立响应

```css
.dashboard {
  container: dashboard / inline-size;
}
.widget {
  container: widget / inline-size;
}

@container dashboard (min-width: 1000px) {
  ...;
}
@container widget (min-width: 300px) {
  ...;
}
```

## CSS 模块化方案：BEM/OOCSS/SMACSS 比较

### BEM（块、元素、修饰符）

- 块独立存在（.block）
- 元素依赖于块（.block\_\_element）
- 修饰符描述块或元素的状态（.block--modifier 或 .block\_\_element--modifier）
- 禁止嵌套选择器，避免层级依赖

```css
<div class="search-form search-form--dark">
  <input class="search-form__input">
  <button class="search-form__button search-form__button--disabled">Search</button>
</div>
```

### OOCSS （Object-Oriented CSS）

- 分离容器与内容 ​​：样式不依赖位置
- 分离结构与皮肤 ​​：基础结构（如布局）与视觉样式（如颜色）解耦
- 强调类复用（如.button 和.button-primary）

例如：

```css
/* 基础结构 */
.btn {
  padding: 10px 20px;
  border: none;
  border-radius: 4px;
  font-size: 16px;
  cursor: pointer;
  display: inline-block;
  text-align: center;
  text-decoration: none;
  transition: all 0.3s ease;
}

/* 样式变体 */
.btn-primary {
  background-color: #007bff;
  color: white;
}

.btn-danger {
  background-color: #dc3545;
  color: white;
}

.btn-success {
  background-color: #28a745;
  color: white;
}

/* 尺寸变体 */
.btn-sm {
  padding: 5px 10px;
  font-size: 14px;
}

.btn-lg {
  padding: 15px 30px;
  font-size: 18px;
}
```

### SMACC 按照功能分类管理 css

分为 5 类

- Base（基础） - 元素的默认样式
- Layout（布局） - 页面的主要结构框架
- Module（模块） - 可重用的组件
- State（状态） - 描述模块或布局的状态变化
- Theme（主题） - 定义颜色、字体等视觉变化

## CSS 模块化方案在现代前端框架（如 React/Vue）中的最佳实践是什么

### React

1. css modules

- 核心机制 ​​：通过构建工具（Webpack/Vite）将类名哈希化，实现局部作用域
- 最佳实践：
  - ​​ 文件命名 ​​：使用 .module.css 后缀（如 Button.module.css）
  - ​​ 类名规范 ​​：结合 BEM 命名（如 .button\_\_submit--disabled）提升可读性
  - ​​ 动态样式 ​​：通过 classnames 库管理条件类名：
  - ​​ 全局样式 ​​：用 :global() 包裹需全局生效的样式（如重置样式）

2. CSS-in-JS

- 核心机制 ​​：将样式定义为 JavaScript 对象，动态生成类名
- 使用库： styled-components、Emotion
- 最佳实践：
  - 组件级样式：每个组件独立定义样式，避免全局污染
  - 动态样式：支持 props 动态修改样式
  - 主题支持：通过 ThemeProvider 实现全局主题切换

3. 组合方案

- 基础组件 ​​：用 CSS Modules 保证隔离性。
- ​ 高频动态组件 ​​（如动画按钮）：用 CSS-in-JS 简化逻辑。

### Vue

1. Scoped CSS

- 机制 ​​：在 `<style scoped>` 中自动添加属性选择器（如 `[data-v-123]`）实现局部作用域
- 最佳实践：
  - 深度选择器：用::v-deep 覆盖子组件样式
  - 主题支持：通过 ThemeProvider 实现全局主题切换

2. css Modules

- 机制 ​​：与 React 类似，通过 Webpack/Vite 配置启用

### 跨框架通用最佳实践 ​

1. ​​ 命名规范与结构 ​：
   - 采用 BEM、OOCSS 或 SMACSS 等命名规范，提高可读性和可维护性。
   - 组件样式文件与组件逻辑文件保持同级目录结构，便于管理。
2. 样式复用与变量管理 ​
   - 使用 CSS 预处理器（如 Sass、Less）管理变量和混合宏。
   - 提取公共样式到基础样式文件，避免重复代码。
   - 通过 composes（CSS Modules）或 @extend（Sass）组合基础样式
3. 性能优化
   - 压缩未使用样式：用 PurgeCSS 删除冗余代码
   - 避免深层嵌套​​：限制选择器层级（建议 ≤ 3 层）
   - 首屏关键 CSS​​：内联核心样式，异步加载其余

