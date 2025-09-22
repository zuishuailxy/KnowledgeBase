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

function swapPairs(head: ListNode | null): ListNode | null {
  let dummy = new ListNode(0)
  dummy.next = head
  let prev = dummy

  while (prev.next && prev.next.next) {
      let first = prev.next
      let second = first.next

      // 交换
      prev.next = second
      first.next = second.next
      second.next = first

      // 移动prev
      prev = first
  }
  

  return dummy.next
};