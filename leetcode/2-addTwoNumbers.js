/**
 * Definition for singly-linked list.
 * function ListNode(val, next) {
 *     this.val = (val===undefined ? 0 : val)
 *     this.next = (next===undefined ? null : next)
 * }
 */
/**
 * @param {ListNode} l1
 * @param {ListNode} l2
 * @return {ListNode}
 */
// 如果是数组，可以这样做
// var addTwoNumbers = function(l1, l2) {
//   // define a swap helper function
//   const swap = (list) => {
//     let left = 0;
//     let right = list.length - 1;

//     while (left < right) {
//       [list[left], list[right]] = [list[right], list[left]];
//       left++;
//       right--;
//     }

//     return list;
//   }

//   const reverseL1 = swap([...l1]);
//   const reverseL2 = swap([...l2]);

//   const sum = Number(reverseL1.join('')) + Number(reverseL2.join(''));

//   return swap(sum.toString().split(''));
// };



// let l1 = [2,4,3]
// let l2 = [5,6,4]
// console.log(addTwoNumbers(l1, l2))
// l1 = [0]
// l2 = [0]
// console.log(addTwoNumbers(l1, l2))
// l1 = [9,9,9,9,9,9,9]
// l2 = [9,9,9,9]
// console.log(addTwoNumbers(l1, l2))


// 如果是链表，可以这样做

function ListNode(val = 0, next = null) {
  this.val = val;
  this.next = next;
}

// 模拟
function addTwoNumbers(l1, l2) {
  const dummy = new ListNode()// 创建哑节点作为结果链表的头
  let current = dummy       // 当前节点指针
  let carry = 0           // 进位值

  // 遍历链表直到两个链表都为空且无进位
  while (l1 || l2 || carry) {
    // 获取当前节点的值（如果存在）
    const val1 = l1 ? l1.val : 0;
    const val2 = l2 ? l2.val : 0;
    // 计算当前位的和（含进位）
    const total = val1 + val2 + carry;
    // 更新进位值
    carry = Math.floor(total / 10);
    const digit = total % 10; // 当前位的值
    // 创建新节点并移动指针
    current.next = new ListNode(digit);
    current = current.next;

    // 移动原始链表指针（如果存在）
    if (l1) l1 = l1.next;
    if (l2) l2 = l2.next;
  }

  return dummy.next; // 返回结果链表的头（跳过哑节点）
}

// 创建链表 342: 2 -> 4 -> 3
const l1 = new ListNode(2);
l1.next = new ListNode(4);
l1.next.next = new ListNode(3);

  // 创建链表 465: 5 -> 6 -> 4
  const l2 = new ListNode(8);
  l2.next = new ListNode(6);
  l2.next.next = new ListNode(4);

  // 计算结果 807: 7 -> 0 -> 8
  const result = addTwoNumbers(l1, l2);

  // 遍历结果链表
  let node = result;
  while (node) {
    console.log(node.val); // 输出 7 -> 0 -> 8
    node = node.next;
  }
