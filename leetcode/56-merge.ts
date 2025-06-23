
/**
 * @solution: 是排序预处理和线性合并
 * 
 * Given an array of intervals where intervals[i] = [starti, endi], merge all overlapping intervals,
 * and return an array of the non-overlapping intervals that cover all the intervals in the input.
 */
function merge(intervals: number[][]): number[][] {
  // 处理边际 case
  if (intervals.length === 0) return [];

  // 对区间按照升序排序
  intervals.sort((a, b) => a[0] - b[0]);

  // 初始化结果
  const merged: number[][] = [intervals[0]];

  // 遍历区间
  for (let i = 1; i < intervals.length; i++) {
    const last = merged[merged.length - 1];
    const current = intervals[i];

    // 5. 关键判断：当前区间是否与最后区间重叠
    if (current[0] <= last[1]) {
      // 有重叠：合并区间（取最大结束位置)
      last[1] = Math.max(last[1], current[1]);

    } else {
      // 无重叠：直接添加新区间
      merged.push(current);
    }
  }

  return merged;
};