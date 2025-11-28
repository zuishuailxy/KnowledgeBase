// jsx/tsx -> babel / swc-> React.createElement

const React = {
  createElement(type, props, ...children) {
    return {
      type,
      props: {
        ...props,
        children: children.map((child) =>
          typeof child === "object" ? child : this.createTextElement(child)
        ),
      },
    };
  },

  createTextElement(text) {
    return {
      type: "TEXT_ELEMENT",
      props: {
        nodeValue: text,
        children: [],
      },
    };
  },
};

// const vdom = React.createElement(
//   "div",
//   { id: 1 },
//   React.createElement("span", null, "Hello, leo")
// );
// console.log(vdom);

// 虚拟dom 转fiber 结构 和 时间切片

let nextUnitOfWork = null; // 下一个工作单元
let currentRoot = null; // 旧的fiber树
let wipRoot = null; // 当前正在工作的fiber树
let deletions = null; // 要删除的fiber节点 deletions[D], {A, B, C, D} -> {A, B, C}

// Fiber 渲染入口
function render(element, container) {
  //wipRoot 表示“正在进行的工作根”，它是 Fiber 架构中渲染任务的起点
  wipRoot = {
    dom: container, //渲染目标的 DOM 容器
    props: {
      children: [element], //要渲染的元素（例如 React 元素）
    },
    alternate: currentRoot, // 旧的 fiber 树
  };
  //专门用于存放在更新过程中需要删除的节点。在 Fiber 更新机制中，如果某些节点不再需要，就会将它们放入 deletions，
  deletions = [];
  nextUnitOfWork = wipRoot; //nextUnitOfWork 是下一个要执行的工作单元（即 Fiber 节点）。在这里，将其设置为 wipRoot，表示渲染工作从根节点开始
}

function createDom(fiber) {
  const dom =
    fiber.type === "TEXT_ELEMENT"
      ? document.createTextNode("")
      : document.createElement(fiber.type);
  updateDom(dom, {}, fiber.props);
  return dom;
}

function updateDom(dom, prevProps, nextProps) {
  const isProperty = (key) => key !== "children";
  // 旧的属性要删除
  Object.keys(prevProps)
    .filter(isProperty)
    .forEach((name) => {
      dom[name] = "";
    });

  // 新的属性要添加
  Object.keys(nextProps)
    .filter(isProperty)
    .filter(name => prevProps[name] !== nextProps[name])
    .forEach((name) => {
      dom[name] = nextProps[name];
    });
}

// Fiber 调度器
// 实现将耗时任务拆分成多个小的工作单元
function workLoop(deadline) {
  //deadline 表示浏览器空闲时间
  //是一个标志，用来指示是否需要让出控制权给浏览器。如果时间快用完了，则设为 true，以便及时暂停任务，避免阻塞主线程
  let shouldYield = false;
  while (!shouldYield && nextUnitOfWork) {
    // performUnitOfWork 是一个函数，它处理当前的工作单元，并返回下一个要执行的工作单元。每次循环会更新 nextUnitOfWork 为下一个工作单元
    nextUnitOfWork = performUnitOfWork(nextUnitOfWork);
    //使用 deadline.timeRemaining() 来检查剩余的空闲时间。如果时间少于 1 毫秒，就设置 shouldYield 为 true，表示没有空闲时间了，就让出控制权
    shouldYield = deadline.timeRemaining() < 1; //没有空闲时间
  }

  //当没有下一个工作单元时（nextUnitOfWork 为 null），并且有一个待提交的“工作根”（wipRoot），就会调用 commitRoot() 将最终的结果应用到 DOM 中
  if (!nextUnitOfWork && wipRoot) {
    commitRoot();
  }

  requestIdleCallback(workLoop);
  //使用 requestIdleCallback 来安排下一个空闲时间段继续执行 workLoop，让任务在浏览器空闲时继续进行
}


//requestIdleCallback 浏览器绘制一帧16ms 空闲的时间去执行的函数 浏览器自动执行 
//浏览器一帧做些什么
//1.处理时间的回调click...事件
//2.处理计时器的回调
//3.开始帧
//4.执行requestAnimationFrame 动画的回调
//5.计算机页面布局计算 合并到主线程
//6.绘制
//7.如果此时还有空闲时间，执行requestIdleCallback
requestIdleCallback(workLoop);

// 执行一个工作单元
function performUnitOfWork(fiber) {
   // 如果没有 DOM 节点，为当前 Fiber 创建 DOM 节点
  if (!fiber.dom) {
    fiber.dom = createDom(fiber);
  }

  //确保每个 Fiber 节点都在内存中有一个对应的 DOM 节点准备好，以便后续在提交阶段更新到实际的 DOM 树中
  // 子节点
  const elements = fiber.props.children;

  // 遍历子节点
  reconcileChildren(fiber, elements);

  // 返回下一个工作单元（child, sibling, or parent）
  if (fiber.child) {
    return fiber.child;
  }

   // 递归调用，处理兄弟节点
  let nextFiber = fiber;
  while (nextFiber) {
    if (nextFiber.sibling) {
      // 如果有的话 返回兄弟节点
      return nextFiber.sibling;
    }
    // 否则，返回父亲节点，向上查找
    nextFiber = nextFiber.parent;
  }

  return null;
}

function createFiber(element, parent) {
  return {
    type: element.type,
    props: element.props,
    parent,
    dom: null,  // 关联的 DOM 节点
    child: null, // 子节点
    sibling: null, // 兄弟节点
    alternate: null, // 对应的前一次 Fiber 节点
    effectTag: null, // 'PLACEMENT', 'UPDATE', 'DELETION'
  };
}

// Diff 算法: 将子节点与之前的 Fiber 树进行比较
function reconcileChildren(fiber, elements) {
  // diff 算法
  // 形成 fiber
  let index = 0;
  let prevSibling = null;
  let oldFiber = fiber.alternate && fiber.alternate.child; // 旧的 Fiber 树

  while (index < elements.length || oldFiber != null) {
    // diff 第一步 复用
    let newFiber = null;
    const element = elements[index];
    const sameType = oldFiber && element && element.type === oldFiber.type;
    
    // 如果是同类型的节点，复用
    if (sameType) {
      console.log(element, 'update')
      newFiber = {
        type: oldFiber.type,
        props: element.props,
        parent: fiber,
        dom: oldFiber.dom,
        alternate: oldFiber,
        effectTag: "UPDATE", //更新，复用
      };
    }

    // diff 第二步 新增
    //如果新节点存在，但类型不同，新增fiber节点
    if (element && !sameType) {
      console.log(element, 'add')
      newFiber = createFiber(element, fiber);
      newFiber.effectTag = "PLACEMENT"; //新增
    }

    // diff 第三步 删除
    //如果旧节点存在，但新节点不存在，删除旧节点
    if (oldFiber && !sameType) {
      console.log(oldFiber, 'delete')
      deletions.push(oldFiber);
      oldFiber.effectTag = "DELETION"; // 删除
    }
    // 移动指针到下一个 old fiber
    if (oldFiber) oldFiber = oldFiber.sibling;

    if (index == 0) {
      fiber.child = newFiber;
    } else if (element) {
      prevSibling.sibling = newFiber;
    }

    prevSibling = newFiber;
    index++;
  }
}

function commitRoot() {
  deletions.forEach(commitWork);
  commitWork(wipRoot.child);
  currentRoot = wipRoot; // 存储旧的 fiber
  wipRoot = null; // 把所有的变化都操作完了，回归原始
}

function commitWork(fiber) {
  if (!fiber) return;
  const domParent = fiber.parent.dom;

  if (fiber.effectTag === "PLACEMENT" && fiber.dom != null) {
    domParent.appendChild(fiber.dom);
  } else if (fiber.effectTag === "UPDATE"  && fiber.dom != null) {
    updateDom(fiber.dom, fiber.alternate, fiber.props);
  } else if (fiber.effectTag === "DELETION") {
    domParent.removeChild(fiber.dom);
  }

  commitWork(fiber.child);
  commitWork(fiber.sibling);
}

// Render
render(
  React.createElement(
    "div",
    { id: "root", className: "container" },
    React.createElement("span", null, "leo")
  ),
  document.getElementById("root")
);

setTimeout(() => {
  render(
    React.createElement(
      "div",
      { id: "root", className: "container" },
      React.createElement("p", null, "good")
    ),
    document.getElementById("root")
  );
}, 10000);
