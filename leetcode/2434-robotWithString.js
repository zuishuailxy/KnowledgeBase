/**
 * @param {string} s
 * @return {string}
 */
var robotWithString = function (s) {
  const n = s.length;
  // 1. 预处理：计算后缀最小值
  const minArr = new Array(n + 1)
  minArr[n] = '{'; // 最后一个字符的后缀最小值

  for (let i = n - 1; i >= 0; i--) {
    minArr[i] = s[i] < minArr[i + 1] ? s[i] : minArr[i + 1];
  }

  // 2. 使用栈处理字符
  const stack = [];
  const result = [];

  for (let i = 0; i < n; i++) {
    stack.push(s[i]); // 将当前字符压入栈
    // 贪心决策：当栈顶字符≤后续最小值时出栈

    while (stack.length && stack[stack.length - 1] <= minArr[i + 1]) {
      result.push(stack.pop()); // 出栈并添加到结果
    }

  };

  // 3. 处理栈中剩余字符
  while (stack.length) {
    result.push(stack.pop());
  }
  return result.join('');
}

  console.log(robotWithString("zza")); // "azz"
  console.log(robotWithString("bac")); // "abc"
