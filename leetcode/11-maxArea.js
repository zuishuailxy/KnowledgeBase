/**
 * @solution 双指针法。初始化两个指针，一个指向数组的开始，一个指向数组的末尾。计算当前两个指针之间的面积，并记录最大面积。然后移动较短的那一侧的指针，直到两个指针相遇。
 * @param {number[]} height
 * @return {number}
 */
var maxArea = function(height) {
  let left = 0; // 左指针
  let right = height.length - 1; // 右指针
  let maxArea = 0; // 最大面积

  while (left < right) {
    // 计算当前面积
    const width = right - left; // 宽度
    const currentHeight = Math.min(height[left], height[right]); // 高度取两边较小的
    const currentArea = width * currentHeight; // 面积
    maxArea = Math.max(maxArea, currentArea); // 更新最大面积
    // 移动较短的那一侧的指针
    if (height[left] < height[right]) {
      left++; // 如果左边的高度小，移动左指针
    } else {
      right--; // 如果右边的高度小或相等，移动右指针
    }
  }
  return maxArea;
};

const height = [1,8,6,2,5,4,8,3,7];
console.log(maxArea(height)); // 输出最大面积