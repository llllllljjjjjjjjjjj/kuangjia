//需要代理的对象
window = top = self = parent = ldvm.toolsFunc.proxy(window, "window")
document = ldvm.toolsFunc.proxy(document, "document")
navigator = ldvm.toolsFunc.proxy(navigator, "navigator")
location = ldvm.toolsFunc.proxy(location, "location")
history = ldvm.toolsFunc.proxy(history, "history")  
performance = ldvm.toolsFunc.proxy(performance, "performance")  
localStorage = ldvm.toolsFunc.proxy(localStorage, 'localStorage');
chrome = ldvm.toolsFunc.proxy(chrome, 'chrome');
globlaThis = window