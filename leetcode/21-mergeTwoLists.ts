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
function mergeTwoLists(list1: ListNode | null, list2: ListNode | null): ListNode | null {
  // 创建哨兵节点，简化边界处理
  const dummy = new ListNode(0)
  let current = dummy

  // 双指针遍历两个链表
  while (list1 !== null && list2 !== null) {
    if (list1.val < list2.val) {
      current.next = list1
      list1 = list1.next
    } else {
      current.next = list2
      list2 = list2.val
    }

    current = current.next
  }
  // 连接剩余节点（已经有序）
  current.next = list1 || list2

  return dummy.next

};