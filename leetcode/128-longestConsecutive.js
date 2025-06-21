/**
 * @solution 将所有数字放到集合里，然后遍历每个数字，检查它是否是一个序列的起点（即前一个数字不在集合中）。如果是，就从这个数字开始向后查找连续的数字，直到找到不连续的数字为止。记录最长的连续序列长度。
 * @param {number[]} nums
 * @return {number}
 */
var longestConsecutive = function (nums) {
  const set = new Set(nums); // 去重
  let longest = 0;
  // 遍历集合中的每个数字
  for (const num of set) {
    // 检查当前数字是否是一个序列的起点
    if (!set.has(num - 1)) {
      let currentNum = num;
      let currentStreak = 1;

      while (set.has(currentNum + 1)) {
        currentNum++;
        currentStreak++;
      }
      longest = Math.max(longest, currentStreak);
    }

  }
  return longest;
};

const nums = [100, 4, 200, 1, 3, 2, 5]
console.log(longestConsecutive(nums)); // 输出 4，因为最长连续序列是 [1, 2, 3, 4]
