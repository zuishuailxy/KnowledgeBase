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
