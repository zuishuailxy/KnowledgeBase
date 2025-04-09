// 利用哈希表
const twoSum = (nums, target) => {
	const map = new Map()

	for (let i = 0; i < nums.length; i++) {
		const diff = nums[i] - target
		if (map.has(diff)) {
			return [map.get(diff) , i]
		} 

		map.set(nums[i], i)
	}

	return
}