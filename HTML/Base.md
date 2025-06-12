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

<code>title</code>: 表示文档的标题

<code>meta</code>: 元数据

charset 表示字符编码

name 表示 meta 的类型， content 表示 meta 的内容

网站 fav

```
<link rel="icon" href="favicon.ico" type="image/x-icon" />
```

css

```
<link rel="stylesheet" href="my-css-file.css" />
```

script

```
<script src="my-js-file.js" defer></script>
```

为文档表明语言

```
<html lang="zh-CN">
  …
</html>
```
