/**
方法：中心扩展法
思路：遍历字符串，以每个字符（或两个字符中间）为中心，向两边扩展，寻找回文串。
 * @param {string} s
 * @return {string}
 */
var longestPalindrome = function(s) {
  const len = s.length
  if (len < 2) return s;

  let start = 0; // 最长回文子串起始位置
  let maxLen = 1; // 最长回文子串长度

  // 中心扩展函数
  const expendAroundCenter = (left, right) => {
    while (left >= 0 && right < len && s[left] === s[right]) {
      const currentLen = right - left + 1
      if (currentLen > maxLen) {
        maxLen = currentLen
        start = left
      }

      left--; // 向左
      right++; // 向右 两边扩展

    }
  }
  // 遍历每个可能的中心点
  for (let i = 0; i < len; i++) {
    expendAroundCenter(i, i); // 奇数长度回文
    expendAroundCenter(i, i + 1); // 偶数长度回文
  }


  return s.substring(start, start + maxLen);
};

console.log(longestPalindrome("babad")); // "bab" 或 "aba"
console.log(longestPalindrome("cbbd"));  // "bb"
console.log(longestPalindrome("a"));     // "a"
console.log(longestPalindrome("ac"));    // "a"
console.log(longestPalindrome("abb"));   // "bb"