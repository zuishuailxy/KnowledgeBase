# Web Component

## 概念

允许你创建可复用的自定义元素，并且在 web 应用中使用它们

## 三项技术

- custom element
- Shadow dom
- HTML Template

### Custom Element

由 Web 开发人员定义行为的 HTML 元素，扩展了浏览器中可用的元素集。

一 分类：

自定义内置元素： 已经定义了标准的元素行为，例如： `HTMLIMageElement`,`HTMLParagraphElement`

独立自定义元素: 继承自 HTML 元素基类，需要从头开始实现它的行为

二 实现：
利用类来扩展

三 生命周期

- `connectedCallback()`：每当元素添加到文档中时调用。规范建议开发人员尽可能在此回调中实现自定义元素的设定，而不是在构造函数中实现。
- `disconnectedCallback()`：每当元素从文档中移除时调用。

等。。

### 例子

```HTML
// 为这个元素创建类
class MyCustomElement extends HTMLElement {
  static observedAttributes = ["color", "size"];

  constructor() {
    // 必须首先调用 super 方法
    super();
  }

  connectedCallback() {
    console.log("自定义元素添加至页面。");
  }

  disconnectedCallback() {
    console.log("自定义元素从页面中移除。");
  }

  adoptedCallback() {
    console.log("自定义元素移动至新页面。");
  }

  attributeChangedCallback(name, oldValue, newValue) {
    console.log(`属性 ${name} 已变更。`);
  }
}

customElements.define("my-custom-element", MyCustomElement);
```

### Shadow Dom

一 概念

影子 DOM 允许将隐藏的 DOM 树附加到常规 DOM 树中的元素上
，并且使该树的内部对于在页面中运行的 JavaScript 和 CSS 是隐藏的。

二 常用的概念

- 影子宿主：影子树附加的常规 dom 节点
- 影子树：影子 dom 内部的 DOM 树
- 影子边界：影子 DOM 终止，常规 DOM 开始的地方
- 影子根：影子树的根节点

三 创建，操作

```html
<div id="host"></div>
<span>I'm not in the shadow DOM</span>
```

```js
// 创建
const host = document.querySelector("#host");
const shadow = host.attachShadow({ mode: "open" }); //利用attachShadow, mode open 可以为页面提供一种破坏影子的方法
const span = document.createElement("span");
span.textContent = "I'm in the shadow DOM";
shadow.appendChild(span);

// 操作
const host = document.querySelector("#host");
const shadow = host.attachShadow({ mode: "open" });
const span = document.createElement("span");
span.textContent = "I'm in the shadow DOM";
shadow.appendChild(span);

const upper = document.querySelector("button#upper");
upper.addEventListener("click", () => {
  const spans = Array.from(host.shadowRoot.querySelectorAll("span"));
  for (const span of spans) {
    span.textContent = span.textContent.toUpperCase();
  }
});

const reload = document.querySelector("#reload");
reload.addEventListener("click", () => document.location.reload());
```

四 样式 ： 两种方式

- 编程式：构建一个 `CSSStyleSheet` 对象再将其附加到影子根
- 声明式：在 `template` 元素的声明中添加一个 `<style>` 元素

```js
// 编程式
const sheet = new CSSStyleSheet();
sheet.replaceSync("span { color: red; border: 2px dotted black;}");

const host = document.querySelector("#host");

const shadow = host.attachShadow({ mode: "open" });
shadow.adoptedStyleSheets = [sheet];

const span = document.createElement("span");
span.textContent = "I'm in the shadow DOM";
shadow.appendChild(span);
```

声明式

```HTML
<template id="my-element">
  <style>
    span {
      color: red;
      border: 2px dotted black;
    }
  </style>
  <span>I'm in the shadow DOM</span>
</template>

<div id="host"></div>
<span>I'm not in the shadow DOM</span>
```

```js
const host = document.querySelector("#host");
const shadow = host.attachShadow({ mode: "open" });
const template = document.getElementById("my-element");

shadow.appendChild(template.content);
```

五 配合 自定义元素

```JS
// 定义元素
class FilledCircle extends HTMLElement {
  constructor() {
    super();
  }
  connectedCallback() {
    // 创建一个影子根
    // 自定义元素自身是影子宿主
    const shadow = this.attachShadow({ mode: "open" });

    // 创建内部实现
    const svg = document.createElementNS("http://www.w3.org/2000/svg", "svg");
    const circle = document.createElementNS(
      "http://www.w3.org/2000/svg",
      "circle",
    );
    circle.setAttribute("cx", "50");
    circle.setAttribute("cy", "50");
    circle.setAttribute("r", "50");
    circle.setAttribute("fill", this.getAttribute("color"));
    svg.appendChild(circle);

    shadow.appendChild(svg);
  }
}

customElements.define("filled-circle", FilledCircle);
```

```html
<filled-circle color="blue"></filled-circle>
```

### Template 和 Slot

`<template>` 元素及其内容不会在 DOM 中渲染，但仍可以用 JS 引用

```html
<template id="my-paragraph">
  <style>
    p {
      color: white;
      background-color: #666;
      padding: 5px;
    }
  </style>
  <p>我的段落</p>
  <span slot="my-text">让我们使用一些不同的文本！</span> // 通过 slot
  属性定义插槽
</template>
```

```js
customElements.define(
  "my-paragraph",
  class extends HTMLElement {
    constructor() {
      super();
      let template = document.getElementById("my-paragraph");
      let templateContent = template.content;

      const shadowRoot = this.attachShadow({ mode: "open" });
      shadowRoot.appendChild(templateContent.cloneNode(true)); //将模版内容的克隆添加到通过 Node.cloneNode() 方法创建的影子根上
    }
  }
);
```

## 总结

实现 web component 的基本方法通常如下所示：

1. 创建一个类或函数来指定 web 组件的功能，如果使用类，请使用 ECMAScript 2015 的类语法
2. 使用 CustomElementRegistry.define() 方法注册你的新自定义元素，并向其传递要定义的元素名称、指定元素功能的类、以及可选的其所继承自的元素。
3. 如果需要的话，使用 Element.attachShadow() 方法将一个 shadow DOM 附加到自定义元素上。使用通常的 DOM 方法向 shadow DOM 中添加子元素、事件监听器等等。
4. 如果需要的话，使用 `<template>` 和 `<slot>` 定义一个 HTML 模板。再次使用常规 DOM 方法克隆模板并将其附加到你的 shadow DOM 中。
5. 在页面任何你喜欢的位置使用自定义元素，就像使用常规 HTML 元素那样。
