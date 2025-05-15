const lengthOfLongestSubstring = (s) => {
	const map = new Map()
	let left = 0
	let max = 0

	for (let right = 0; right < s.length; right++) {
		if (map.has(s[right])) {
			findIndex = map.get(s[right]) + 1
			left = Math.max(findIndex, left)
		}

		map.set(s[right], i)
		max = Math.max(max, right - left + 1)
	}

	return max
}