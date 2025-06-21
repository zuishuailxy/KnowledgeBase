/**
 * @solution 三数之和问题。首先对数组进行排序，然后使用双指针法来查找满足条件的三元组。外层循环遍历每个元素，内层使用两个指针分别指向当前元素的下一个位置和数组的末尾，计算三数之和并根据结果调整指针位置。
  * 注意去重处理，避免重复的三元组。
 * @param {number[]} nums
 * @return {number[][]}
 */
var threeSum = function(nums) {
    nums.sort((a, b) => a - b); // 对数组进行排序
    const res = []

    for (let i = 0; i < nums.length - 2; i++) {
      if (i > 0 && nums[i] === nums[i - 1]) continue; // 去重处理
      if (nums[i] > 0) break; // 如果当前数字大于0，后面的数字都大于0，不可能有三数之和为0

      let left = i + 1
      let right = nums.length - 1;
      while (left < right) {
        const sum = nums[i] + nums[left] + nums[right];
        if (sum === 0) {
          res.push([nums[i], nums[left], nums[right]]);
          while (left < right && nums[left] === nums[left + 1]) left++; // 去重处理
          while(left < right && nums[right] === nums[right - 1]) right--;
          // 两边同时移动 寻找新的可能
          left++
          right--;

        } else if (sum < 0) {
          left++; // 如果和小于0，左指针右移
        } else {
          right--; // 如果和大于0，右指针左移
        }
      }
    }
    return res;
};

const data = [-1, 0, 1, 2, -1, -4];
const result = threeSum(data);
console.log(result); // 输出三元组