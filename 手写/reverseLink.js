const reverseList = (nums) => {
	let prev = null
	let curr = head
	while (curr) {
		let next = curr.next // 保存节点
		curr.next = prev // 反转
		prev = curr // 移动prev
		curr = next // 移动curr
	}

	return prev
}


const reverseList2 = (nums) => {
	if (!head || !head.next) {
		return head
	}

	const newReversed = reverseList2(head.next)

	head.next.next = head
	head.next = null

	return newReversed
}

