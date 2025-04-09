// 组合继承

function Parent () {}
function Child() {
	// 继承父类属性
	Parent.call(this)
}
Child.prototype = Object.create(Parent.prototype) // 只继承原型，避免执行 Parent
Child.prototype.constructor = Child // 修正构造函数指向自身

