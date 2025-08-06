// 1.阶乘
function factorial(n) {
  if (n === 0) {
    return 1;
  }
  return n * factorial(n - 1);
}

//  斐波拉契 + Memoization fib(6) = 8
function fib(n, memo = {}) {
  if (n <= 1) return n;
  if (memo[n]) return memo[n];
  memo[n] = fib(n - 1, memo) + fib(n - 2, memo);
  return memo[n];
}

// 数组扁平化 // 示例：flatten([1, [2, [3, 4]], 5]) => [1, 2, 3, 4, 5]
function flatten(arr) {
  const result = [];
  for (const item of arr) {
    if (Array.isArray(item)) {
      result.push(...flatten(item))
    } else {
      result.push(item)
    }
  }
  return result
}

// 反转字符串 示例：reverse('abc') => 'cba'
function reverse(str) {
  if (str.length <= 1) return str;
  return reverse(str.slice(1)) + str[0];
}

// 树的最大深度 
function maxDepth(root) {
    if (!root) return 0;
  let depth = 0;
  for (const child of root.children || []) {
    depth = Math.max(depth, maxDepth(child));
  }
  return depth + 1;
}

// 二叉树的中序遍历（In-order Traversal）
function inorderTraversal(root) {
  const result = [];
  const traverse = (node) => {
    if (!node) return;
    traverse(node.left);
    result.push(node.value);
    traverse(node.right);
  };
  traverse(root);
  return result;
}

function inorder(root) {
  if (!root) return [];
  return [...inorder(root.left), root.value, ...inorder(root.right)];
}