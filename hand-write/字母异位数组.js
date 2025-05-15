function groupAnagrams(strs) {
  const hashMap = new Map()

  for (let str of strs) {
    const sortedStr = str.split('').sort().join('')
    if (!hashMap.has(sortedStr)) {
      hashMap.set(sortedStr, [])
    }
    hashMap.get(sortedStr).push(str)
  }

  return Array.from(hashMap.values())
}