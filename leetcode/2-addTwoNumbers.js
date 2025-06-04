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
var addTwoNumbers = function(l1, l2) {
  // define a swap helper function
  const swap = (list) => {
    let left = 0;
    let right = list.length - 1;

    while (left < right) {
      [list[left], list[right]] = [list[right], list[left]];
      left++;
      right--;
    }

    return list;
  }
    
  const reverseL1 = swap([...l1]);
  const reverseL2 = swap([...l2]);

  const sum = Number(reverseL1.join('')) + Number(reverseL2.join(''));

  return swap(sum.toString().split(''));
};

// 如果是链表，可以这样做

let l1 = [2,4,3]
let l2 = [5,6,4]
console.log(addTwoNumbers(l1, l2))
l1 = [0]
l2 = [0]
console.log(addTwoNumbers(l1, l2))
l1 = [9,9,9,9,9,9,9]
l2 = [9,9,9,9]
console.log(addTwoNumbers(l1, l2))