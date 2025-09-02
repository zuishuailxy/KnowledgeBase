# ES6+新特性

## 一 ES6 (2015) 核心特性

1. 块级作用域
  let、const（替代 var，解决变量提升、作用域污染问题）

2. 字符串增强
  模板字符串

3. 函数增强
   - 箭头函数
   - 默认参数
   - 剩余参数 (...args)

4. 解构赋值

   ```js
    const [a, b] = [1, 2];
    const {name, age} = user;
    ```

5. 扩展运算符

   ```js
    const arr2 = [...arr1];
    const obj2 = {...obj1};
   ```

6. 对象增强
    - 属性简写 {name, age}
    - 方法简写 say(){}

7. 模块化
   - export / import （替代 CommonJS）

8. 类 (class)
   - class / extends / super
   - 语法糖,本质还是基于原型链

9. Promise
10. Symbol / Map / Set

## 二 ES7 (2016)

1. 指数运算符 2**3 === 8
2. Array.prototype.includes

## 三 ES8 (2017)

1. async / await
2. Object.values / Object.entries
3. String padding

## 四 ES9 (2018)

1. 异步迭代器 for await (let item of asyncIterable)
2. 对象展开符：const obj2 = {...obj1}
3. Promise.finally()

## 五 ES10 (2019)

1. Array.flat / flatMap
2. Object.fromEntries
3. trimStart / trimEnd
4. 可选的 catch 绑定

## 六 ES11

1. 动态 import()

   ```js
    const module = await import('./a.js');
   ```

2. BigInt (123n)
3. Optional chaining obj?.a?.b
4. Nullish coalescing a ?? b（只在 null/undefined 时生效）
5. globalThis

## 七、ES12 (2021)

1. 逻辑赋值运算符

   ```js
    a ||= b
    a &&= b
    a ??= b
    ```

2. Promise.any
3. WeakRef
4. String.replaceAll

## 八、ES13

1. 顶层await
2. class fields (公共、私有 #)
3. 静态 class 块
4. Array.prototype.at()
5. Object.hasOwn()

## 九 ES14

1. Array findLast / findLastIndex
2. Array.prototype.toReversed(), toSorted(), toSpliced()
3. Array.prototype.with() - 非变异的索引替换

   ```js
    const withArray = [1, 2, 3, 4, 5];
    console.log('✅ with()方法:', withArray.with(2, 'three')); // [1, 2, 'three', 4, 5]
    console.log('✅ 原数组不变:', withArray); // [1, 2, 3, 4, 5]
  ```
