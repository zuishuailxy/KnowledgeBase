/**
 * @solution 滑动窗口 + 字符计数数组 + 匹配计数优化
 * @param {string} s
 * @param {string} p
 * @return {number[]}
 */
var findAnagrams = function (s, p) {
  const sLen = s.length;
  const pLen = p.length;
  if (sLen < pLen) return []; // 如果 s 的长度小于 p 的长度，直接返回空数组

  // 初始化字符计数数组
  const sCount = new Array(26).fill(0);
  const pCount = new Array(26).fill(0);
  const result = [];


  for (let i = 0; i < pLen; i++) {
    pCount[p[i].charCodeAt(0) - 97]++;
  }

  // 初始匹配计数
  let matched = 0;
  for (let i = 0; i < sLen; i++) {
    // 添加新字符到窗口右侧
    const rCharIndex = s[i].charCodeAt(0) - 97;
    sCount[rCharIndex]++;

    // 更新匹配计数
    if (sCount[rCharIndex] <= pCount[rCharIndex]) {
      matched++;
    }

    // 当窗口达到p的长度时
    if (i >= pLen - 1) {
      // 检查是否完全匹配
      if (matched === pLen) {
        result.push(i - pLen + 1); // 记录起始索引
      }

      // 准备移动窗口：移除左侧字符
      const lCharIndex = s[i - pLen + 1].charCodeAt(0) - 97;
      if (sCount[lCharIndex] <= pCount[lCharIndex]) {
        matched--; // 如果移除的字符在p中存在，减少匹配计数
      }
      sCount[lCharIndex]--; // 移除左侧字符的计数
    }
  }
  return result;
};

const data = "cbaebabacd"
console.log(findAnagrams(data, "abc"));
