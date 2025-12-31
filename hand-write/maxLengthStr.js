const lengthOfLongestSubstring = (s) => {
	const map = new Map()
	let left = 0
	let max = 0

	for (let right = 0; right < s.length; right++) {
    const curChar = s[right]
		if (map.has(curChar) && map.get(curChar) >= left) {
			const findIndex = map.get(curChar) + 1
			left = Math.max(findIndex, left)
		}

		map.set(curChar, right)
		max = Math.max(max, right - left + 1)
	}

	return max
}