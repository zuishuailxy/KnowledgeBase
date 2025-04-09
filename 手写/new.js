//  创建新的obj
// 新的obj 指向 构造函数的原型
// 将构造函数的this 绑定到obj
const myNew = (fn, ...args) => {
	// 1. 创建一个空对象，并将其原型指向构造函数的 prototype
	const obj = Object.create(fn.prototype)
	// 2. 将构造函数的 this 绑定到新对象上，并传入参数
	const result = fn.apply(obj, args)

	// 3. 如果构造函数返回的是一个对象，则返回该对象；否则返回步骤 1 创建的对象
	return result instanceof Object ? result : obj
}