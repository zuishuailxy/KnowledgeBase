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
// 前序遍历 左根右
// function inorderTraversal(root: TreeNode | null): number[] {
//     // 递归
//     const result: number[] = []
//     const dfs = (node: TreeNode | null) => {
//         if (!node) return
//         dfs(node.left)
//         result.push(node.val)
//         dfs(node.right)
//     }
//     dfs(root)
//     return result
// };


function inorderTraversal(root: TreeNode | null): number[] {
    // 遍历
    const result: number[] = []
    const stack: TreeNode[] = []
    let current = root
    while (current || stack.length > 0) {
       // 一路向左，把节点记录下来
        while (current) {
            stack.push(current)
            current = current.left
        }
        // 取出栈顶节点（左子树访问完）
        current = stack.pop()
        result.push(current.val)

        // 再访问它的右子树
        current = current.right
    }
    return result
};