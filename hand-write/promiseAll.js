const myAll = (promises) => {
	return new Promise((resolve, reject) => {
		const result = []
		let count = 0;
		const len = promises.length
		for (let i = 0; i < len; i++) {
			const subPromise = Promises[i]
			Promise.resolve(subPromise).then(res => {
				result[i] = res
				count++
				if (count === len) {
					resolve(result)
				}
			}).catch(err => {
				reject(err)
			})

		}
	})
}