/**
 * solution: 双指针，当任一指针到达链表末尾时，将其重定向到另一个链表的头节点，这样两个指针都会遍历完整的两个链表（链表A + 链表B）
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

function getIntersectionNode(headA: ListNode | null, headB: ListNode | null): ListNode | null {
  if (!headA || !headB) return null

  let pointerA = headA
  let pointerB = headB

  while (pointerA !== pointerB) {
    pointerA = pointerA ? pointerA.next : headB
    pointerB = pointerB ? pointerB.next : headA
  }

  return pointerA
};