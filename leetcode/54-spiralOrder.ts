// 实现思路：
// 初始化上、下、左、右边界。
// 当上边界不超过下边界且左边界不超过右边界时，循环执行：
// a. 从左到右遍历上边界，加入结果，然后上边界下移（top++）
// b. 从上到下遍历右边界，加入结果，然后右边界左移（right--）
// c. 确保还有行（top<=bottom），然后从右到左遍历下边界，加入结果，然后下边界上移（bottom--）
// d. 确保还有列（left<=right），然后从下到上遍历左边界，加入结果，然后左边界右移（left++）
// 返回结果数组。
function spiralOrder(matrix: number[][]): number[] {
  // 如果矩阵为空或为空数组，直接返回空数组
  if (matrix.length === 0 || matrix[0].length === 0) {
    return [];
  }

  // 初始化边界
  let top = 0;
  let bottom = matrix.length - 1;
  let left = 0;
  let right = matrix[0].length - 1;

  const result:number[] = [];
  // 当上边界不超过下边界且左边界不超过右边界时，循环执行
  while (top <= bottom && left <= right) {
    // 1. 从左向右遍历上边界
    for (let i = left; i <= right; i++) {
      result.push(matrix[top][i]);
    }
    top++; // 上边界下移

    // 2. 从上向下遍历右边界
    for (let i = top; i <= bottom; i++) {
      result.push(matrix[i][right]);
    }
    right--; // 右边界左移

    // 3. 检查是否还有有效的行
    if (top <= bottom) {
      // 从右向左遍历下边界
      for (let i = right; i >= left; i--) {
        result.push(matrix[bottom][i]);
      }
      bottom--; // 下边界上移
    }

    // 4. 检查是否还有有效的列
    if (left <= right) {
      // 从下向上遍历左边界
      for (let i = bottom; i >= top; i--) {
        result.push(matrix[i][left]);
      }
      left++; // 左边界右移
    }
  }

  return result;
};