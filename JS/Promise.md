# Promise 和 Async / await

## Promise

处理异步操作的现代解决方案，解决了回调地狱问题。

- 单次结果的异步占位符：代表一次可能在未来完成或失败的操作。
- 微任务调度： then/catch/finally 的回调在当前宏任务结束后、下一个渲染前的微任务队列里执行。

### 三种状态

- pending（待定）: 初始状态，既没有被兑现，也没有被拒绝
- fulfilled（已兑现）: 操作成功完成
- rejected（已拒绝）: 操作失败

```js
const p = new Promise((resolve, reject) => {
  // 异步工作...
  resolve(42);           // 或 reject(new Error('x'))
});

p.then(v => console.log(v)); // 42（微任务）

```

### 状态与回调核心

1. then(onFulfilled, onRejected) 返回一个新的 Promise（记住：链上的每一步都是“新 Promise”）。
2. onFulfilled 的返回值，会传给下一个 then：
   1. 返回普通值 ⇒ 变成下一个 Promise 的 fulfilled 值
   2. 返回一个 Promise ⇒ 等待它 settle，再把结果传下去
   3. 抛出异常或返回 rejected Promise ⇒ 下一个进入 rejected
3. catch(fn) 等价于 then(undefined, fn)，但还能捕获之前 then 里抛出的同步异常。
4. finally(fn) 不接收链上传值；它用于清理。
   1. 若 finally 返回普通值 ⇒ 被忽略，原值/原因继续传递
   2. 若 finally 抛错/返回 rejected ⇒ 覆盖为 rejected

```js
Promise.resolve(1)
  .then(v => v + 1)                 // 2
  .then(v => Promise.resolve(v*2))  // 4
  .then(() => { throw new Error('boom'); })
  .catch(err => 'recovered')        // 'recovered'
  .finally(() => console.log('cleanup')) // 不改变链值
  .then(v => console.log(v));       // 'recovered'
```

### 微任务与事件循环

```js
console.log('A');
setTimeout(() => console.log('timeout')); // 宏任务
Promise.resolve().then(() => console.log('micro')); // 微任务
console.log('B');
// 输出：A, B, micro, timeout
```

口诀：同步 → 微任务(清空) → 下个宏任务。

浏览器/Node 都遵守这个节奏（Node 还有 process.nextTick 优先级更高，但你现在关注 Promise 足够了）。

### 常见方法

1. Promise.resolve(x)
   1. 如果 x 是普通值 ⇒ 立刻创建 fulfilled。
   2. 如果 x 是thenable（有 then）⇒ **会“吸收/展开”**它（等待它 settle）。
   3. 用于把同步值统一成 Promise。
2. Promise.reject(e)
   1. 直接创建 rejected；不会展开 thenable
3. Promise.all(iterable)
   1. 全成功才成功，返回所有结果的数组，保持输入顺序。
   2. 任意一个 reject ⇒ 立即 reject（短路）。
   3. 常用来并行请求且需要全部结果。

   ```js

    await Promise.all([fetch(a), fetch(b)]); // 有一个错就整体抛错

    ```

4. Promise.allSettled(iterable)
   1. 等全部 settle（无论成败），返回 {status, value|reason} 数组。
   2. 适合全量汇总，不让单点失败影响整体。
5. Promise.race(iterable)
   1. 第一个 settle 的结果（成功或失败）决定返回
   2. 常用于手写超时（见下）。
6. Promise.any(iterable)
   1. 第一个 fulfilled 就返回；
   2. 若全部 reject ⇒ AggregateError。
   3. 适合“谁先成功用谁”

### 超时， 重试， 并发控制

1. 超时

    ```js
    // 利用 race 和 setTimeout
    function withTimeout(promise, ms, msg='Timeout') {
      const timeout = new Promise((_, rej) => setTimeout(() => rej(new Error(msg)), ms));
      return Promise.race([promise, timeout]);
    }
    await withTimeout(fetch(url), 5000);
    ```

2. 重试(指数退避)
  
   ```js
    async function retry(fn, times=3, baseDelay=200) {
      let lastErr;
      for (let i = 0; i < times; i++) {
        try { return await fn(); }
        catch (e) {
          lastErr = e;
          await new Promise(r => setTimeout(r, baseDelay * 2**i));
        }
      }
      throw lastErr;
    }
   ```

3. 并发控制

    ```js
      async function pool(urls, limit, worker) {
        const ret = [];
        let i = 0;
        const runners = Array.from({length: limit}, async function run(){
          while (i < urls.length) {
            const cur = i++;
            ret[cur] = await worker(urls[cur], cur);
          }
        });
        await Promise.all(runners);
        return ret;
      }

      // 用法
      const results = await pool(urls, 5, async (u, index) => fetch(u).then(r=>r.json()));
    ```

4. Promisify 回调API转为Promise

  ```js
    function promisify(fn) {
    return (...args) => new Promise((resolve, reject) => {
      fn(...args, (err, data) => err ? reject(err) : resolve(data));
    });
  }
  ```

### 取消与中断

利用**AbortController** 传给支持的 API

```js
const ac = new AbortController();
const p = fetch(url, { signal: ac.signal });
// 需要取消：
ac.abort();
```

### async / await 是语法糖

- await X 等同于“等待 Promise.resolve(X) settle，然后取值或抛错”。
- try/catch 包裹 await 等价于链式 .catch。

```js
// ❌ 串行
const a = await fetch(A);
const b = await fetch(B);

// ✅ 并行
const [a, b] = await Promise.all([fetch(A), fetch(B)]);
```
