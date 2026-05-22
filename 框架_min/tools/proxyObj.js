//需要代理的对象
window = top = self = parent = ldvm.toolsFunc.proxy(window, "window")
document = ldvm.toolsFunc.proxy(document, "document")
