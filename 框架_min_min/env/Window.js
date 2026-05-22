Window = function Window(){
    ldvm.toolsFunc.throwError("TypeError", "Illegal constructor")
}
ldvm.toolsFunc.safeProto(Window, "Window")
Object.setPrototypeOf(Window.prototype, WindowProperties.prototype)

