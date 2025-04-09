## 解构赋值提取字符串

```typescript
// 传统方式
const firstChar = str.charAt(0);
const lastChar = str.charAt(str.length - 1);

// 解构赋值
// 这里rest element 只能放在第一位
const [firstChar, ...rest] = str;
const lastChar = str.slice(-1);
```

## repeat

```typescript
const repeated = (str, times) => str.repeat(times)
```
