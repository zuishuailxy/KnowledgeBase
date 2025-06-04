/**
 * @solution 使用滑动窗口和哈希表来记录字符的索引位置
 * @description 维护一个窗口，记录当前无重复字符的最长子串长度。使用哈希表来存储字符的最新索引位置。
 * @param {string} s
 * @return {number}
 */
var lengthOfLongestSubstring = function(s) {
    let maxLen = 0;
    const charIndexMap = new Map(); // 用于记录每个字符最近一次出现的索引
    let left = 0; // 窗口的左边界
    const sLen = s.length;
    for (let right = 0; right < sLen; right++) {
      const char = s[right];
      // 如果当前字符已经在Map中，并且其最近出现的索引大于等于当前窗口左边界（说明重复字符在当前窗口内）
      if (charIndexMap.has(char) && charIndexMap.get(char) >= left) {
        // 则将左边界移动到上一次这个字符出现位置的下一个位置（因为不能包含重复字符，所以从下一位开始）
        left = charIndexMap.get(char) + 1;
      }
      // 更新（或添加）当前字符的最新索引
      charIndexMap.set(char, right);
      // 计算当前窗口的长度并更新最大长度
      maxLen = Math.max(maxLen, right - left + 1);
    }
    return maxLen;
};

const s = "abcabcbb";

console.log(lengthOfLongestSubstring(s)); // 输出 3，因为最长无重复子串是 "abc"