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
// 快慢指针，快指针多走n+1步
function removeNthFromEnd(head: ListNode | null, n: number): ListNode | null {
  let dummy = new ListNode(0)
  dummy.next = head

  let fast = dummy
  let slow = dummy

  // fast 先走 n+1 步
  for (let i = 0; i <= n ; i++) {
    fast = fast.next
  } 

  // fast slow 一起走
  while (fast) {
    fast = fast.next
    slow = slow.next
  }

  slow.next = slow.next.next

  return dummy.next

};