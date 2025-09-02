/**
 * Definition for singly-linked list.
 * class ListNode {
 *     val: number
 *     next: ListNode | null
 *     constructor(val?: number, next?: ListNode | null) {
 *         this.val = (val===undefined ? 0 : val)
 *         this.next = (next===undefined ? null : next)
 *     }
 * }
 */
// 迭代
function reverseList(head: ListNode | null): ListNode | null {
  let prev = null
  let curr = head

  while (curr) {
    let next = curr.next // 保存下一个节点
    curr.next = prev // 反转
    prev = curr // 移动 prev
    curr = next  // 移动 curr
  }
  
  return prev // 新的头节点
};

// 递归解法（空间复杂度O(n)）
var reverseListRecursive = function(head) {
  // 基础情况
  if (head === null || head.next === null) {
      return head;
  }
  
  // 递归反转剩余部分
  let newHead = reverseListRecursive(head.next);
  
  // 反转当前连接
  head.next.next = head;
  head.next = null;
  
  return newHead;
};