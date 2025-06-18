# 面试题

## 1.语义化标签

Q：为什么 HTML5 提倡使用`<header>/<nav>`等语义标签？如何替代`<div class="header">`这种写法？​

A: 本质上用 HTML 标签本身传达内容含义.

优势:

- 可访问性提升
- SEO 优化: 搜索引擎会加权处理语义标签内的关键词
- 代码可维护性

注意点:

- `section` 内必须包含`h1` - `h6`,否则语义无效
- `article` 内容具备完整语义, 可独立上下文阅读

### 2. Meta 标签

Q:以下两个 meta 标签的作用分别是什么？​

```html
<meta name="viewport" content="width=device-width, initial-scale=1" />
<meta http-equiv="X-UA-Compatible" content="IE=edge" />
```

A: `viewport`: 移动端适配, 视口的宽度为 设备宽度,且初始缩放比例为 1
`X-UA-Compatible`: 强制 IE 使用最新渲染引擎 (避免兼容模式)

### 3.性能优化

Q: HTML 层面的性能优化

A：

- 响应式图片: 通过浏览器自动选择最适配当前设备的图片资源,解决"桌面大图在手机上浪费流量"的问题

```html
<img
  src="small.jpg"
  srcset="small.jpg 480w, medium.jpg 880w, large.jpg 1200w"
  sizes="(max-with: 660px) 480px, 800px"
  alt="响应式图片示例"
/>
```

- 原生懒加载

方案一:

```html
<img src="image.jpg" loading="lazy" alt="延迟加载图片" />
```

方案二: 利用 IntersectionObserver API

```html
<img data-src="image.jpg" class="lazyload" alt="JS控制懒加载" />
<script>
  const lazyLoad = () => {
    const lazyImages = document.querySelector(".lazyload");
    const observe = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            const img = entry.target;
            img.src = img.dataset.src;
            observe.unobserve(img);
          }
        });
      },
      {
        threshold: 1,
      }
    );
  };
</script>
```

- 新一代图片格式优化: 利用 `webp` 和 `avif` 等高压缩图片

```html
<picture>
  <!-- AVIF格式（压缩率最高） -->
  <source type="image/avif" srcset="image.avif 1x, image@2x.avif 2x" />

  <!-- WebP格式（最佳兼容性） -->
  <source type="image/webp" srcset="image.webp 1x, image@2x.webp 2x" />

  <!-- 终极回退方案 -->
  <img
    src="image.jpg"
    srcset="image.jpg 1x, image@2x.jpg 2x"
    alt="自适应格式图片"
  />
</picture>
```

- 扩展优化方案

1. 预加载关键图片: 利用`<link rel="preload">`

```html
<link rel="preload" href="hero-banner.jpg" as="image" fetchpriority="high" />
```

2. 响应式背景图: CSS image-set 实现背景图响应

```css
.hero {
  background-image: image-set(url("banner.jpg") 1x, url("banner-2x.jpg") 2x);
  background-image: -webkit-image-set(
    url("banner.jpg") 1x,
    url("banner-2x.jpg") 2x
  );
}
```

### 4.表单设计

Q: 设计一个带搜索建议的输入框,至少列出 5 个关键 HTML 属性和标签

A: datalist + input[list]组合,autocomplete 关闭浏览器自动填充

```html
<input type="search" list="suggestions" autocomplete="off" />
<datalist id="suggestions">
  <option value="React"></option>
  <option value="Vue"></option>
</datalist>
```

### 5.多媒体

Q: `<video>`标签中 preload="metadata"和 preload="auto"的行为区别？​

- metadata: 仅加载视频时长/尺寸等元信息
- auto: 自动加载整个视频

### 6.渲染原理

Q：CSS 阻塞渲染时,如何让 HTML 内容提前显示

- 拆分首屏 css: 内联核心样式,异步加载非核心 css
- 使用`<link rel="preload" as="style" onload="this.rel='stylesheet'">`

### 7.设计题

Q：仅用 HTML+原生标签设计一个可键盘操作的树形菜单（无需写 CSS/JS）​

- `<details>` 开合控制 + role="treeitem" 辅助技术识别

```html
<details>
  <summary role="treeitem">一级菜单</summary>
  <details>
    <summary role="treeitem">二级菜单</summary>
    <a href="#" role="treeitem">末级选项</a>
  </details>
</details>
```
