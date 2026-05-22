Window = function Window(){
    //模拟浏览器new Window()报错--
    ldvm.toolsFunc.throwError("TypeError", "Illegal constructor")
}

// //native化-补Window.toString()
// ldvm.toolsFunc.setNative(Window, "Window")

// //补window.toString()--这是Window.prototype上的Symbol.toStringTag
// ldvm.toolsFunc.reNameObj(Window, "Window")

//保护Window原型
ldvm.toolsFunc.safeProto(Window, "Window")

Object.setPrototypeOf(Window.prototype, WindowProperties.prototype)


//浏览器访问不到WindowProperties,但是window补环境需要，所有补完原型链后删除


