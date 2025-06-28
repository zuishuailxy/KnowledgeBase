
//​前缀乘积​：计算 left[i] = nums[0] × nums[1] × ... × nums[i-1]
// ​后缀乘积​：计算 right[i] = nums[i+1] × nums[i+2] × ... × nums[n-1]
// ​合并结果​：answer[i] = left[i] × right[i]
// 通过复用输出数组和动态计算后缀乘积 实现空间复杂o(1)
function productExceptSelf(nums: number[]): number[] {
  const n = nums.length;
  if (n < 2) return nums;
  const answer = new Array(n)

  // Step 1: 计算前缀乘积（存储到输出数组）
  answer[0] = 1;
  for (let i = 1; i < n; i++) {
    answer[i] = answer[i - 1] * nums[i - 1];
  }

  // step 2: 计算后缀乘积并合并结果
  let suffix = 1
  for (let i = n - 1; i >= 0; i--) {
    answer[i] = answer[i] * suffix; // 合并前缀和后缀乘积
    suffix *= nums[i]; // 更新后缀乘积
  }

  return answer

};