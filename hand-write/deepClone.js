// 用weakMap 来缓存
// 递归遍历
// 根据 是不是数组来 创建 不同的结果

const myDeepClone = (obj, map = new WeakMap()) => {
	if (typeof obj !== 'object' || obj === null) return obj
	if (map.has(obj)) return map.get(obj)

	const result = Array.isArray(obj) ? [] : {}
	map.set(obj, result)

	for (const key in obj) {
		if (obj.hasOwnProperty(key)) {
			result[key] = myDeepClone(obj[key], map)
		}
	}


	return result
}