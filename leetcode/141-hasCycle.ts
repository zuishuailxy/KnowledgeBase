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
// 快慢指针
function hasCycle(head: ListNode | null): boolean {
  if (!head || !head.next) return false

  let slow = head
  let fast = head

  while (fast && fast.next) {
    slow = slow.next
    fast = fast.next.next

    if (slow === fast) {
      return true
    }
  }
  
  return false
};

// 利用set
function hasCycle(head: ListNode | null): boolean {
  const visited = new Set()
  let current = head

  while (current) {
    if (visited.has(current)) {
      return true
    }

    visited.add(current)
    current = current.next
  }
  return false
};