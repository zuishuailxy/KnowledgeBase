// 改变this 指向
// return 新的obj
// 支持参数

Function.prototype.myBind = (context, ...args) => {
	if (typeof context !== "function") {
		throw new Error('not a function')
	}

	// 保存原函数
	const fn = this
	return function(...callArgs) {
		const allArgs = args.concat(callArgs)
		if (this instanceof fn) {
			// 作为构造函数来使用的话
			const res = fn.apply(this, allArgs)
			return res instanceof Object ? res : this
		}

		return fn.apply(context, allArgs)
	}
}


