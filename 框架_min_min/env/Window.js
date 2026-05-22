Window = function Window(){
    ldvm.toolsFunc.throwError("TypeError", "Failed to construct 'Window': Illegal constructor")
}
ldvm.toolsFunc.safeProto(Window, "Window")
Object.setPrototypeOf(Window.prototype, WindowProperties.prototype)

