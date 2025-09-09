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

function detectCycle(head: ListNode | null): ListNode | null {
  if (!head || !head.next) return null

  let slow = head
  let fast = head
  while (fast && fast.next) {
    slow = slow.next
    fast = fast.next.next

    if (slow === fast) {
      break
    }
  }

  // 如果没有环
  if (!fast || !fast.next) {
    return null;
  }

  // 第二阶段：找入口
  let ptr1 = head;
  let ptr2 = slow;

  while (ptr1 !== ptr2) {
    ptr1 = ptr1.next;
    ptr2 = ptr2.next;
  }

  return ptr1;

};


function detectCycle2(head: ListNode | null): ListNode | null {
  const visited = new Set()
  let current = head

  while (current) {
    if (visited.has(current)) {
      return current
    }

    visited.add(current)
    current = current.next
  }

  return null
}