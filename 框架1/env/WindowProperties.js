

WindowProperties = function WindowProperties(){}

//保护原型
// //native化-补Window.toString()
// ldvm.toolsFunc.setNative(WindowProperties, "WindowProperties")
// //补window.toString()--这是Window.prototype上的Symbol.toStringTag
// ldvm.toolsFunc.reNameObj(WindowProperties, "WindowProperties")
ldvm.toolsFunc.safeProto(WindowProperties, "WindowProperties")

//设置window原型 ,把window的原型设置为Window(大写)
Object.setPrototypeOf(WindowProperties.prototype, EventTarget.prototype)