//全局对象配置
debugger
ldvm = {
    "toolsFunc": {},//功能函数相关，插件
    "envFunc": {},//具体环境实现相关
    "config": {}, //配置相关
    "memory": {}, //内存相关
}
ldvm.config.proxy = true//是否开启代理
ldvm.config.print = true//是否输出日志
ldvm.memory.symbolProxy = Symbol("proxy")
ldvm.memory.filterProxyProp = [
    ldvm.memory.symbolProxy, 
    Symbol.toPrimitive, "eval", Object.prototype, Array.prototype, Function.prototype,
    String.prototype, Number.prototype, Boolean.prototype,
    Math, Date, RegExp, JSON, Promise, 'prototype', '__proto__', 
    "Document", "Window", "History", "Navigator", "Location", "Performance","EventTarget", "Event", 
    'constructor'
    
]//需要过滤的属性
ldvm.memory.symbolData = Symbol("data"); // 保存当前对象上原型的属性
ldvm.memory.tag = []//存储tag标签

ldvm.memory.globalVar = {}
ldvm.memory.globalVar.jsonCookie = {}//存储全局变量
ldvm.memory.globalVar.gontList = ["SimHei", "SimSun", "NSimSun", "FangSong", "KaiTi"]//认为浏览器能够识别字体