/**
 * @param {number[]} nums
 * @return {void} Do not return anything, modify nums in-place instead.
 */
var moveZeroes = function(nums) {
  const len = nums.length;
  let slow = 0; // 慢指针，指向非零元素的位置
  for (let fast = 0; fast < len; fast++) {
    if (nums[fast] !== 0) { // 如果当前元素不是零
      [nums[slow], nums[fast]] = [nums[fast], nums[slow]]; // 交换非零元素到慢指针位置
      slow++; // 慢指针向前移动
    }
  }
};
const test = [0,1,0,3,12];
moveZeroes(test);
console.log(test);