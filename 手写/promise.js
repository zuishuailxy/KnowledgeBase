class MyPromise {
	constructor(executor) {
		this.state = []
		this.value = null
		this.reason = null
    this.onFulfilledCallbacks = []; // 存储 then 里的成功回调
    this.onRejectedCallbacks = []; // 存储 then 里的失败回调

    const resolve = (value) => {
    	if (this.state === 'pending') {
    		this.state = 'fulfilled'
    		this.value = value
    		this.onFulfilledCallbacks.forEach(cb => cb())
    	}
    }

    const reject = (reason) => {
    	if (this.state === 'pending') {
    		this.state = 'reject'
    		this.reason = reason
    		this.onRejectedCallbacks.forEach(cb => cb())
    	}
    }


		try {
			executor(resolve, reject)
		} catch (err) {
			reject(err)
		}
	}

  then(onFulfilled, onRejected) {
    if (this.state === "fulfilled") {
      onFulfilled(this.value);
    }
    if (this.state === "rejected") {
      onRejected(this.reason);
    }
    if (this.state === "pending") {
      // 状态未定，存储回调
      this.onFulfilledCallbacks.push(() => onFulfilled(this.value));
      this.onRejectedCallbacks.push(() => onRejected(this.reason));
    }
  }
}