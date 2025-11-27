// jsx/tsx -> babel / swc-> React.createElement


const React = {
  createElement(type, props, ...children) {
    return {
      type,
      props: {
        ...props,
        children: children.map(child =>
          typeof child === "object"
            ? child
            : this.createTextElement(child)
        )
      }
    }
  },

  createTextElement(text) {
    return {
      type: "TEXT_ELEMENT",
      props: {
        nodeValue: text,
        children: [],
      }
    }
  }

}


const vdom = React.createElement('div', { id: 1 }, React.createElement('span', null, 'Hello, leo'))
console.log(vdom)

// 虚拟dom 转fiber 结构 和 时间切片

let nextUnitOfWork = null; // 下一个工作单元
let currentRoot = null; // 旧的fiber树
let wipRoot = null; // 当前正在工作的fiber树
let deletions = null; // 要删除的fiber节点

// Fiber 渲染入口
function render(element, container) {
  nextUnitOfWork = {
    dom:container,
    props: {
      children: [element]
    }
  }

}

function createDom(fiber) {
  const dom = element.type === "TEXT_ELEMENT" ? document.createTextNode('') : document.createElement(element.type);
  const isProperty = key => key !== "children";
  Object.keys(element.props).filter(isProperty).forEach(name => {
    dom[name] = element.props[name];
  });
  return dom;
}



function workLoop(deadline) {
  let shouldYield = false;
  while (!shouldYield && nextUnitOfWork) {
    nextUnitOfWork = performUnitOfWork(nextUnitOfWork);
    shouldYield = deadline.timeRemaining() < 1;
  }
  requestIdleCallback(workLoop);
}
requestIdleCallback(workLoop);

requestIdleCallback(workLoop)

function performUnitOfWork(nextUnitOfWork) {
  if (!fiber.dom) {
    fiber.dom = createDom(fiber);
  }

  if (fiber.parent) {
    fiber.parent.dom.appendChild(fiber.dom);
  }
}