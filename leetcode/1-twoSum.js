/**
 * @param {number[]} nums
 * @param {number} target
 * @return {number[]}
 */
var twoSum = function(nums, target) {
    const len = nums.length;
    const map = new Map();

    for (let i = 0; i < len; i++) {
      const diff = target - nums[i];
      if (map.has(diff)) {
        const index = map.get(diff);
        return [index, i];
      } else {
        map.set(nums[i], i);
      }
    }

    return []
};

console.log(twoSum([2,7,11,15], 9))
console.log(twoSum([3,2,4], 6))
console.log(twoSum([3,3], 6))