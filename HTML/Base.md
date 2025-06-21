# 基础内容

## 块级元素 和 内联元素

块级元素：就像一个一个方块

- 在页面上以快的形式展现。
- 一个块级元素出现在它前面的内容之后的新行上。
- 任何跟在块级元素后面的内容也会出现在新的行上

内联元素：

- 块级元素中环绕文档内容的一部分
- 不会导致文本换行

## HTML 元信息

HTML 头部包含 head 信息, 包含页面的元数据

`title`: 表示文档的标题

`meta`: 元数据

charset 表示字符编码

name 表示 meta 的类型， content 表示 meta 的内容

网站 fav

```html
<link rel="icon" href="favicon.ico" type="image/x-icon" />
```

css

```html
<link rel="stylesheet" href="my-css-file.css" />
```

script

```html
<script src="my-js-file.js" defer></script>
```

为文档表明语言

```html
<html lang="zh-CN">
  …
</html>
```

## HTML 语义化

使用恰当的 HTML 标签来表示页面的内容，而不仅仅是为了样式控制。

优势：

- 提升可访问性
- 增强 SEO
- 改善代码的可维护性
- 更好的设备兼容性

常见的语义化标签：

`<header>`: 页面的头部内容，包括标题 导航栏 logo

`<nav></nav>`: 导航栏链接

`<main></main>`: 文档的主要内容，每个页面只出现一次

`<article></article>`: 独立内容块， 播客文章 新闻内容 评论

`<section></section>`: 内容主题分组 章节 内容分段

`<aside></aside>`: 与主内容间接相关的内容 侧边栏，广告区域

`<footer></footer>`: 页脚区域 版权信息，联系方式

`<figure></figure> & <figcaption></figcaption>`: 媒体内容及标题 图片 图表 代码块等

### 语义化核心原则

1. **目的驱动的标签选择** : 根据内容的含义和功能，而非样式来选择标签
2. **可访问性优先**
   - 为图片添加`alt`属性
   - 使用语义化表单元素
   - 添加 ARIA 角色和属性增加可访问性
3. **语义化层级**
   - 合理使用标题标签(h1-h6)
   - 使用列表标签
4. **清晰的文档轮廓**
   - 使用 `main` , `section` , `article` 等标签形成逻辑结构
   - 保持不同内容之间的独立性

## 表格

利用 `col` 和 `colgroup` 设置样式,

```html
<table>
  <colgroup>
    <col />
    <col style="background-color: yellow" span="2" />
  </colgroup>
  <tr>
    <th>数据 1</th>
    <th>数据 2</th>
  </tr>
  <tr>
    <td>加尔各答</td>
    <td>橙汁</td>
  </tr>
  <tr>
    <td>机器人</td>
    <td>爵士乐</td>
  </tr>
</table>
```

利用`<caption></caption>` 设置标题

```html
<table>
  <caption>
    侏罗纪时期的恐龙
  </caption>

  …
</table>
```

利用`<thead></thead>`,`<tbody></tbody>`,`<tfoot></tfoot>` 来结构化表格

利用 `scope` 来告诉阅读器该表头是行还是列; 可选值为`scope="colgroup"` `scope="col"`,屏幕阅读器会识别这种结构化的标记，并一次读出整列或整行。

```html
<thead>
  <tr>
    <th scope="col">购买</th>
    <th scope="col">位置</th>
    <th scope="col">时间</th>
    <th scope="col">评价</th>
    <th scope="col">成本 (€)</th>
  </tr>
</thead>

<tr>
  <th scope="row">理发</th>
  <td>理发店</td>
  <td>12/09</td>
  <td>好主意</td>
  <td>30</td>
</tr>
```
