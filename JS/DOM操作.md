# DOM 操作

## DOM 是什么

DOM（Document Object Model）是浏览器把 HTML 解析成的对象结构，允许JS访问，修改网页的结构，内容，样式

它是一个 ​**树状结构**​（DOM Tree），HTML 的标签、属性、文本等都被抽象成节点（Node）。

## 获取Dom元素

### 常用方法

```js
// 按 ID 获取
document.getElementById('myId')

// 按标签名获取 (HTMLCollection)
document.getElementsByTagName('div')

// 按类名获取 (HTMLCollection)
document.getElementsByClassName('myClass')

// CSS 选择器获取 (单个元素)
document.querySelector('.myClass')

// CSS 选择器获取 (多个元素 NodeList)
document.querySelectorAll('div.myClass')
```

### 修改DOM内容

```js
const el = document.getElementById('myId')

// 改文本
el.textContent = '新内容'  // 只修改纯文本
el.innerText = '新内容'    // 会受 CSS 样式影响
el.innerHTML = '<b>加粗</b>' // 支持 HTML 标签

// 改属性
el.setAttribute('title', '提示文本')
el.id = 'newId'

// 改样式
el.style.color = 'red'
el.style.backgroundColor = '#eee'
```

### 添加/删除节点

```js
const newEl = document.createElement('p')
newEl.textContent = '我是新段落'

// 添加到末尾
document.body.appendChild(newEl)

// 插入到指定元素前
const target = document.getElementById('myId')
document.body.insertBefore(newEl, target)

// 删除元素
target.remove() // 新写法
document.body.removeChild(target) // 旧写法
```

### 操作class

```js
const box = document.querySelector('.box')

// 添加类
box.classList.add('active')

// 删除类
box.classList.remove('hidden')

// 切换类（有则删，无则加）
box.classList.toggle('dark-mode')

// 判断类
box.classList.contains('active') // true/false

```

### 事件绑定

```js
const btn = document.getElementById('btn')

// 方式 1：HTML 属性（不推荐）
<button onclick="alert('hi')"></button>

// 方式 2：DOM 属性（会覆盖旧的事件）
btn.onclick = () => console.log('clicked')

// 方式 3：addEventListener（推荐）
btn.addEventListener('click', () => console.log('clicked'))
btn.removeEventListener('click', handler) // 移除监听
```

### 遍历Dom节点

```js
const parent = document.getElementById('container')

// 子节点（包括文本、注释）
parent.childNodes // NodeList

// 子元素（只包含元素节点）
parent.children // HTMLCollection

// 父节点
parent.parentNode

// 上一个 / 下一个兄弟节点
parent.previousElementSibling
parent.nextElementSibling
```

### 创建文档片段，提升性能

```js
const frag = document.createDocumentFragment()

// 放入碎片里，减少重排重绘
for (let i = 0; i < 1000; i++) {
  const li = document.createElement('li')
  li.textContent = `项目 ${i}`
  frag.appendChild(li)
}
// 一次性插入
document.getElementById('list').appendChild(frag)
```

### 获取元素尺寸和位置

```js
const el = document.querySelector('.box')

el.offsetWidth      // 元素的宽（含 padding + border）
el.offsetHeight

el.clientWidth      // 内容区宽 + padding
el.clientHeight

el.getBoundingClientRect() // 获取元素相对视口的位置和尺寸
```

## DOM 进阶

### DOM 节点类型与区别

- 元素节点（Element）：代表 HTML 标签，例如 `<div>`、`<p>` 等。
- 文本节点（Text）：代表元素中的文本内容。
- 注释节点（Comment）：代表 HTML 注释。
- 文档节点（Document）：代表整个文档。

### DOM 修改

- **创建节点**
  
  ```js
  const el = document.createElement('div');
  el.textContent = 'Hello';
  ```

- **插入节点**

  ```js
  parent.appendChild(el);
  parent.insertBefore(el, referenceNode);
  parent.replaceChild(newNode, oldNode);
  ```

- **删除节点**

  ```js
  parent.removeChild(el);
  parent.replaceChild(newNode, oldNode);
  el.remove();
  ```

### 表单与DOM

#### 表单元素获取与操作

- document.forms：HTMLFormElement 集合
- form.elements：表单内所有字段
- 直接通过 name 访问：form.elements['username']

```js
document.forms.myForm.username.value
```

#### 表单控件值

```js
input.value        // 文本输入、隐藏字段、单选、复选框等
textarea.value     // 多行文本
select.value       // 下拉菜单选中值
checkbox.checked   // 是否勾选
radio.checked
```

#### 表单事件

- input：值变化时触发（实时监听）

- change：值变化并失焦后触发

- submit：表单提交

```js
form.addEventListener('submit', e => {
  e.preventDefault(); // 阻止提交
  // 验证 + 提交逻辑
});
```

#### 表单验证

HTML5 内置属性：

- required 必填

- minlength / maxlength

- pattern 正则匹配

- type="email", type="number" 等会触发特定验证

```js
if (!input.checkValidity()) {
  console.log(input.validationMessage);
}
```

#### 高级技巧

- 防止多次提交

  ```js
  form.addEventListener('submit', e => {
    submitBtn.disabled = true;
  });
  ```

- 模拟表单提交（无 <form> 标签）：

  ```js
  const formData = new FormData();
  formData.append('key', 'value');
  fetch('/api', { method: 'POST', body: formData });
  ```

### 事件流

- 事件捕获（Capture）：从window向下到目标，捕捉事件。
- 事件目标（Target）：到达事件触发的真实元素（event.target）。
- 事件冒泡（Bubble）：从目标向上“冒泡”回 window。

并非所有事件都会冒泡：focus/blur 不冒泡（但 focusin/focusout 会）。mouseenter/leave 不冒泡（用 mouseover/out）。

```js
element.addEventListener('click', (e) => {
  console.log('Clicked!', e);
}, true); // true 表示捕获阶段
```

```js
element.addEventListener('click', (e) => {
  console.log('Clicked!', e);
}, false); // false 表示冒泡阶段，默认
```

#### 监听与选项

对于 touchstart/touchmove/wheel 等滚动相关事件，能 passive 就 passive，减少主线程阻塞。

```js
elem.addEventListener('click', handler, {
  capture: false,   // 是否在捕获阶段触发
  once: true,       // 执行一次后自动移除
  passive: true,    // 告诉浏览器 handler 不会调用 preventDefault（提升滚动性能）
});
```

#### 目标与当前目标

```js
btn.addEventListener('click', e => {
  console.log(e.target);        // 实际触发事件的最深元素（可能是 <span>）
  console.log(e.currentTarget); // 绑定监听器的元素（这里是 btn）
});
```

#### 阻止默认 vs 组织传播

```js
e.preventDefault();          // 阻止浏览器默认行为（如表单提交/滚动）
e.stopPropagation();         // 阻止继续向上/向下传播
e.stopImmediatePropagation(); // 会阻断同一元素剩余的监听器。
```

#### 事件委托

把监听器绑在共同祖先上（通常是列表容器、document 或 window），利用冒泡精准处理目标，减少监听器数量并支持动态节点。

```js
const list = document.querySelector('#todo-list');

list.addEventListener('click', (e) => {
  const item = e.target.closest('li[data-id]');
  if (!item || !list.contains(item)) return; // 防 shadow/portal 等边界
  // 分发子动作
  if (e.target.matches('button.delete')) {
    removeItem(item.dataset.id);
  } else if (e.target.matches('input.toggle')) {
    toggleItem(item.dataset.id, e.target.checked);
  }
});
```
