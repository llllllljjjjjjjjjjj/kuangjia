//需要代理的对象
window = top = self = parent = ldvm.toolsFunc.proxy(window, "window")
navigator = ldvm.toolsFunc.proxy(navigator, "navigator")
document = ldvm.toolsFunc.proxy(document, "document")
localStorage = ldvm.toolsFunc.proxy(localStorage, "localStorage")

location = ldvm.toolsFunc.proxy(location, "location")
