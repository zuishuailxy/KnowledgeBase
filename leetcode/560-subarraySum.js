/**
 * @solution 前缀和 + 哈希表优化
 * @param {number[]} nums
 * @param {number} k
 * @return {number}
 */
var subarraySum = function(nums, k) {
  // 创建哈希表存储前缀和出现次数
    const map = new Map();
    map.set(0, 1);  // 初始化：前缀和为0出现1次

    let currentSum = 0; // 当前前缀和
    let count = 0; // 符合条件的子数组数量

    for (const sum of nums) {
      currentSum += sum;
      
      const neededSum = currentSum - k; // 需要的前缀和
      if (map.has(neededSum)) {
        count += map.get(neededSum); // 如果哈希表中存在需要的前缀和，累加其出现次数
      }

      map.set(currentSum, (map.get(currentSum) || 0) + 1); // 更新当前前缀和的出现次数
    }

    return count;
};

const data = [1,2,3]
console.log(subarraySum(data, 3)); // 输出：2
