/**
 * 原地顺时针旋转 90 度 n × n 矩阵； 先转置矩阵，再reverse每一行。
 * Do not return anything, modify matrix in-place instead.
 */
function rotate(matrix: number[][]): void {
  const n = matrix.length;

  // 1. 转置矩阵（行列互换）
  for (let i = 0; i < n; i++) {
    for (let j = i + 1; j < n; j++) {
      // 交换 matrix[i][j] 和 matrix[j][i]
      [matrix[i][j], matrix[j][i]] = [matrix[j][i], matrix[i][j]];
    }
  }

  // 2. 水平翻转每一行
  for (let i = 0; i < n; i++) {
    let left = 0;
    let right = n - 1;

    while (left < right) {
      // 交换当前行的两端元素
      [matrix[i][left], matrix[i][right]] = [matrix[i][right], matrix[i][left]];
      left++;
      right--;
    }
  }
};