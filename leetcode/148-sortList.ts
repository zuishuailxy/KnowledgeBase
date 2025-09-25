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
/**
 * 方法一：归并排序（推荐）
 * 时间复杂度: O(n log n)
 * 空间复杂度: O(log n) - 递归栈空间
 * 
 * 这是链表排序的最佳解法，稳定且高效
 */
function sortList(head: ListNode | null): ListNode | null {
  if (!head || !head.next) return head

  // 1. 找到链表中点，分割链表
  const mid = findMiddleAndSplit(head);

  // 2.递归排序左右两部分
  const left = sortList(head)
  const right = sortList(mid)

  // 3. 合并两个有序链表
  return mergeTwoSortedLists(left, right)
    
};

function findMiddleAndSplit(head: ListNode | null): ListNode | null {
  let prev = null
  let slow = head
  let fast = head

  // 快慢指针找中点
  while (fast && fast.next) {
    prev = slow
    slow = slow.next
    fast = fast.next.next
  }

  // 分割链表
  if (prev) {
    prev.next = null
  }

  return slow
}
/**
 * 合并两个有序链表
 * 复用之前实现的经典算法
 */
function mergeTwoSortedLists(l1: ListNode | null, l2: ListNode | null): ListNode | null {
  const dummy = new ListNode(0)
  let current = dummy

  while (l1 && l2) {
    if (l1.val<=l2.val) {
      current.next = l1;
      l1 = l1.next
    } else {
      current.next = l2
      l2 = l2.next
    }

    current = current.next
  }
  // 连接剩余节点
  current.next = l1 || l2;

  return dummy.next
}