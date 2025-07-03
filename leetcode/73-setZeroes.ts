
// 把第一行，第一列当做特殊行列处理
// 通过4次遍历来处理
function setZeroes(matrix: number[][]): void {
  const rowLen = matrix.length;
  const colLen = matrix[0].length;
  let firstRowHasZero = false;
  let firstColHasZero = false;

  // Step 1: 检查第一行的每一列是否有0
  for (let j = 0; j < colLen; j++) {
    if (matrix[0][j] === 0) {
      firstRowHasZero = true;
      break;
    }
  }

  // Step 2: 检查第一列的每一行是否有0
  for (let i = 0; i < rowLen; i++) {
    if (matrix[i][0] === 0) {
      firstColHasZero = true;
      break;
    }
  }

  // Step 3: 使用第一行和第一列标记其他行列
  for (let i = 1; i < rowLen; i++) {
    for (let j = 1; j < colLen; j++) {
      if (matrix[i][j] === 0) {
        matrix[i][0] = 0; // 标记当前行
        matrix[0][j] = 0; // 标记当前列
      }
    }
  }

  // Step 4: 根据标记设置0
  for (let i = 1; i < rowLen; i++) {
    for (let j = 1; j < colLen; j++) {
      if (matrix[i][0] === 0 || matrix[0][j] === 0) {
        matrix[i][j] = 0;
      }
    }
  }

  // Step 5: 根据第一行和第一列的标记更新第一行和第一列
  if (firstRowHasZero) {
    for (let j = 0; j < colLen; j++) {
      matrix[0][j] = 0;
    }
  }
  if (firstColHasZero) {
    for (let i = 0; i < rowLen; i++) {
      matrix[i][0] = 0;
    }
  }
};