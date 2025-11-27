// Babel 测试案例

// ES6 箭头函数
const add = (a, b) => a + b;

// 类和继承
class Animal {
  speak() {
    return 'Animal speaks';
  }
}
class Dog extends Animal {
  speak() {
    return 'Woof!';
  }
}

// 解构赋值
const { x, y } = { x: 1, y: 2 };

// 模板字符串
const greeting = `Hello, ${'world'}!`;

// Promise
const asyncTask = () => new Promise(resolve => setTimeout(() => resolve('done'), 100));

// 默认参数
function multiply(a, b = 2) {
  return a * b;
}

// 展开运算符
const arr1 = [1, 2];
const arr2 = [...arr1, 3, 4];

// 导出和导入（仅演示，需配合模块系统）
// export const foo = 42;
// import { foo } from './foo';

// api
const filteredArray = [1, 2, 3, 4].filter(n => n > 2);
const assignedObject = Object.assign({}, { a: 1 }, { b: 2 });


// core-js
