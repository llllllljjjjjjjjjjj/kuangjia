//全局对象配置
debugger 
ldvm = {
    "toolsFunc":{},//功能函数相关，插件
    "envFunc":{},//具体环境实现相关
    "config": {}, //配置相关
    "memory": {}, //内存相关
}
ldvm.config.proxy = true//是否开启代理
ldvm.config.print = true//是否输出日志
ldvm.memory.symbolProxy = Symbol("proxy")
ldvm.memory.filterProxyProp = [ldvm.memory.symbolProxy,Symbol.toPrimitive,  "eval", ]//需要过滤的属性
ldvm.memory.symbolData = Symbol("data"); // 保存当前对象上原型的属性
ldvm.memory.tag = []//存储tag标签
ldvm.memory.asyncEvent = {}
ldvm.memory.asyncEvent.listener = {}//存储异步事件的监听函数

ldvm.memory.globalVar = {}
ldvm.memory.globalVar.jsonCookie = {
    "abRequestId": "4222a77c-10b2-5f59-b50a-e01d52c92c8c",
    "a1": "19d66558c7dsjg559n648ipqioxw68nif3go29mvj50000338198",
    "webId": "13ed1adc9daa427ad356093927d6d34f",
    "gid": "yjfKK22jy8idyjfKK22YSqj6WfMVk22jIK4YkhV3UA3lCl28EKYI3J888qqYyjY8S0JSSDKi",
    "ets": "1779012627065",
    "xsecappid": "xhs-pc-web",
    "webBuild": "6.11.1",
    "loadts": "1779105994995",
    "unread": "{\"ub\":\"69e5c6ae00000000220273f1\",\"ue\":\"6a035c35000000003501c58c\",\"uc\":5}",
    "websectiga": "3633fe24d49c7dd0eb923edc8205740f10fdb18b25d424d2a2322c6196d2a4ad"
}//存储全局变量
ldvm.memory.globalVar.gontList = ["SimHei", "SimSun", "NSimSun", "FangSong", "KaiTi"]//认为浏览器能够识别字体