/**
 * Definition for a binary tree node.
 * class TreeNode {
 *     val: number
 *     left: TreeNode | null
 *     right: TreeNode | null
 *     constructor(val?: number, left?: TreeNode | null, right?: TreeNode | null) {
 *         this.val = (val===undefined ? 0 : val)
 *         this.left = (left===undefined ? null : left)
 *         this.right = (right===undefined ? null : right)
 *     }
 * }
 */

// 方法一 递归
function invertTree(root: TreeNode | null): TreeNode | null {
  if (!root) return null

  // 交换
  [root.left, root.right] = [root.right, root.left]

  // 递归
  invertTree(root.left)
  invertTree(root.right)

  return root
    
};

// 方法二 迭代（BFS 层序遍历，用队列，生产环境推荐）
function invertTree(root: TreeNode | null): TreeNode | null {
  if (!root) return null

  const queue:TreeNode[] = [root]

  while (queue.length > 0) {
    const node = queue.shift();
    [node.left, node.right] = [node.right, node.left]

    if (node.left) queue.push(node.left)
    if (node.right) queue.push(node.right)
  }
  return root
};