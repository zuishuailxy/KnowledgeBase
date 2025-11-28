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

const vdom = React.createElement(
  "div",
  { id: 1 },
  React.createElement("span", null, "Hello, leo")
);
console.log(vdom);

// 虚拟dom 转fiber 结构 和 时间切片

let nextUnitOfWork = null; // 下一个工作单元
let currentRoot = null; // 旧的fiber树
let wipRoot = null; // 当前正在工作的fiber树
let deletions = null; // 要删除的fiber节点 deletions[D], {A, B, C, D} -> {A, B, C}

// Fiber 渲染入口
function render(element, container) {
  // 初始化 fiber 结构
  wipRoot = {
    dom: container,
    props: {
      children: [element],
    },
    alternate: currentRoot, // 旧的 fiber 树
  };

  deletions = [];
  nextUnitOfWork = wipRoot;
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
  Object.keys(prevProps.props)
    .filter(isProperty)
    .forEach((name) => {
      dom[name] = "";
    });

  // 新的属性要添加
  Object.keys(prevProps.props)
    .filter(isProperty)
    .forEach((name) => {
      dom[name] = nextProps[name];
    });
}

function workLoop(deadline) {
  let shouldYield = false;
  while (!shouldYield && nextUnitOfWork) {
    nextUnitOfWork = performUnitOfWork(nextUnitOfWork);
    shouldYield = deadline.timeRemaining() < 1; //没有空闲时间
  }

  // nextUnitOfWork = null, 即所有的任务都执行完了； 并且还有待提交的工作根
  if (!nextUnitOfWork && wipRoot) {
    commitRoot();
  }

  requestIdleCallback(workLoop);
}

requestIdleCallback(workLoop);

function performUnitOfWork(nextUnitOfWork) {
  if (!fiber.dom) {
    fiber.dom = createDom(fiber);
  }
  // 子节点
  const elements = fiber.props.children;

  // 遍历子节点
  reconcileChildren(fiber, elements);

  if (fiber.child) {
    return fiber.child;
  }

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
    dom: null,
    child: null,
    sibling: null,
    alternate: null,
    effectTag: null,
  };
}

function reconcileChildren(fiber, elements) {
  // diff 算法
  // 形成 fiber
  let index = 0;
  let prevSibling = null;
  let oldFiber = fiber.alternate && fiber.alternate.child;

  while (index < elements.length || oldFiber != null) {
    // diff 第一步 复用
    let newFiber = null;
    const element = elements[index];
    const sameType = oldFiber && element && element.type === oldFiber.type;
    if (sameType) {
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
    if (element && !sameType) {
      newFiber = createFiber(element, fiber);
      newFiber.effectTag = "PLACEMENT"; //新增
    }

    // diff 第三步 删除
    if (oldFiber && !sameType) {
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

  if (fiber.effectTag === "PLACEMENT") {
    domParent.appendChild(fiber.dom);
  } else if (fiber.effectTag === "UPDATE") {
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
    { id: "root" },
    React.createElement("span", null, "leo")
  ),
  document.getElementById("root")
);

setTimeout(() => {
  render(
    React.createElement(
      "div",
      { id: "root" },
      React.createElement("p", null, "good")
    ),
    document.getElementById("root")
  );
}, 2000);
