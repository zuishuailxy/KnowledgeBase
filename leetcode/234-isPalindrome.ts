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

// 辅助函数：反转链表
function reverseList(head) {
  let prev = null;
  let curr = head;

  while (curr) {
    let next = curr.next;
    curr.next = prev;
    prev = curr;
    curr = next;
  }

  return prev;
}
// 解法一 找到链表中点，反转后半部分，然后比较两部分是否相等
function isPalindrome(head: ListNode | null): boolean {
  if (!head || !head.next) return true;

  // 1. 找到链表中点
  let slow = head;
  let fast = head;
  while (fast.next && fast.next.next) {
    slow = slow.next;
    fast = fast.next.next;
  }

  // 2. 反转后半部分
  let secondHalf = reverseList(slow.next);

  // 3. 比较两部分是否相等
  let firstHalf = head;
  let result = true;
  while (secondHalf) {
    if (firstHalf.val !== secondHalf.val) result = false;
    firstHalf = firstHalf.next;
    secondHalf = secondHalf.next;
  }

  // 4. 恢复链表（可选）
  slow.next = reverseList(secondHalf);

  return result;
}
// 解法二 使用栈
function isPalindrome2(head: ListNode | null): boolean {
  const values = [];
  while (head) {
    values.push(head.val);
    head = head.next;
  }
  // return values.join("") === values.reverse().join("");

  let i = 0;
  let j = values.length - 1;
  while (i < j) {
    if (values[i] !== values[j]) return false;
    i++;
    j--;
  }
  return true;
}
