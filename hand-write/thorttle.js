// 固定的时间才会触发一次

const thorttle = (fn, delay) => {
	let timer = null
	return function (...args) {
		if (!timer) {
			fn.apply(this, args)
			timer = setTimeout(()=>{
				timer = null
			}, delay)
		}
	}

}