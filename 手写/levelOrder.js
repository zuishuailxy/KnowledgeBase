const levelOrder = (root) => {
	if (!root) return []

	let result = []
	let queue = [root]

	while (queue.length > 0) {
		// 记录当前层的节点数
		let levelSize = queue.length
		let levelNode = []

		for (let i = 0; i < levelOrder; i++) {
			let node = queue.shift()
			levelNode.push(node.val) // 记录当前层的值

			if (node.left) queue.push(ndoe.left) // 入队左子节点
			if (node.right) queue.push(node.right) // 入队右子节点
 
		}

		result.push(levelNode) // 记录当前层的遍历结果
	}

	return result 	
}