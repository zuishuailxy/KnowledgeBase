/**
 * @solution 利用排序后的字符串作为map的键，有相同的的字符串就放到一个数组里作为value
 * @param {string[]} strs
 * @return {string[][]}
 */
var groupAnagrams = function(strs) {
  const map = new Map();
  for (const str of strs) {
    const sortStr = [...str].sort().join('');
    if (!map.has(sortStr)) {
      map.set(sortStr, []);
    }
    map.get(sortStr).push(str);
  }
  return Array.from(map.values());
};

const strs = ["eat", "tea", "tan", "ate", "nat", "bat"];
const res = groupAnagrams(strs);
console.log(res);
