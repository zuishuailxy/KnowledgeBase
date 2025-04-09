// 多次执行的时候 只执行最后一次

const debounce = (fn，delay) => {
	let timer = null
	return function (...args) {
		clearTimeout(timer)
		timer = setTimeout(()=>{
			fn.apply(this, args)
		}, delay)
	}
}

