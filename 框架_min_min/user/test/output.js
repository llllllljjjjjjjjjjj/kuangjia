//全局对象配置
// console.log(this === globalThis)
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

ldvm.memory.globalVar = {}
ldvm.memory.globalVar.jsonCookie = {}//存储全局变量
ldvm.memory.globalVar.gontList = ["SimHei", "SimSun", "NSimSun", "FangSong", "KaiTi"]//认为浏览器能够识别字体
//工具函数代码
//工具代码
!function () {
    // 获取原型对象上自身属性值
    ldvm.toolsFunc.getProtoArr = function getProtoArr(key) {
        return this[ldvm.memory.symbolData] && this[ldvm.memory.symbolData][key];
    }
    ldvm.toolsFunc.setProtoArr = function setProtoArr(key, value) {
        if (!(ldvm.memory.symbolData in this)) {
            Object.defineProperty(this, ldvm.memory.symbolData, {
                enumerable: false,
                configurable: false,
                writable: true,
                value: {}
            });
        }
        this[ldvm.memory.symbolData][key] = value;
    }
    // 获取一个自增的ID
    ldvm.toolsFunc.getID = function getID() {
        if (ldvm.memory.ID === undefined) {
            ldvm.memory.ID = 0;
        }
        ldvm.memory.ID += 1;
        return ldvm.memory.ID;
    }
    //设置实例对象的原型与代理
    ldvm.toolsFunc.createProxyObj = function createProxyObj(obj, proto, name) {
        Object.setPrototypeOf(obj, proto.prototype);
        //ID是为了区分不同的div标签
        return ldvm.toolsFunc.proxy(obj, `${name}_ID(${ldvm.toolsFunc.getID()})`);
    }
    //hook
    ldvm.toolsFunc.hook = function (func, funcInfo, isDebug, onEnter, onLeave, isExec) {
        //func-原函数
        //funcInfo-含objName(目标函数所属的对象的名)、funcName(目标函数在对象上的属性名)属性的对象
        //isDebug-布尔类型， 是否进行调试， 关键点定位， 回溯调用栈
        //onEnter-函数，原函数执行前的操作-输出入参、改原函数入参···
        //onLeave-函数，原函数执行后的操作-输出原函数的返回值、改原函数返回值
        //isExec-布尔类型，是否执行原函数，比如无限debugger
        if (typeof func !== 'function') {
            return func;
        }
        if (funcInfo === undefined) {
            funcInfo = {};
            funcInfo.objName = 'globalThis'
            funcInfo.funcName = func.name || ''
        }
        if (isDebug === undefined) {
            isDebug = false
        }
        if (!onEnter) {
            onEnter = function (obj) {
                console.log(`{hook|${funcInfo.objName}[${funcInfo.funcName}]正在调用， 参数是${JSON.stringify(obj.args)}`)
            }
        }
        if (!onLeave) {
            onLeave = function (obj) {
                console.log(`{hook|${funcInfo.objName}[${funcInfo.funcName}]正在调用， 返回值是${obj.result}`)

            }
        }
        if (isExec === undefined) {
            isExec = true
        }
        let hookFunc = function () {
            if (isDebug) {
                debugger
            }
            let obj = {}
            obj.args = []
            for (let i = 0; i < arguments.length; i++) {
                obj.args[i] = arguments[i];
            }
            onEnter.call(this, obj)
            let result
            if (isExec) {
                result = func.apply(this, obj.args)
            }
            obj.result = result
            onLeave.call(this, obj)
            return obj.result
        }
        //native化
        ldvm.toolsFunc.setNative(hookFunc, funcInfo.funcName)
        //函数重命名
        ldvm.toolsFunc.reNameFunc(hookFunc, funcInfo.funcName)
        return hookFunc
    }
    ldvm.toolsFunc.getType = function (obj) {
        // 遇到代理对象直接返回类型，不调用 toString
        //   if (obj instanceof Proxy) {
        //     return '[object Proxy]'
        //   }
        return Object.prototype.toString.call(obj)
    }
    // ---过滤属性
    ldvm.toolsFunc.filterProxyProp = function filterProxyProp(prop) {
        for (let i = 0; i < ldvm.memory.filterProxyProp.length; i++) {
            if (ldvm.memory.filterProxyProp[i] === prop) {
                return true
            }
        }
        return false
    }
    ldvm.toolsFunc.proxy = function (obj, objName) {
        //obj:原始对象
        //objName:原始对象名字
        if (!ldvm.config.proxy) {
            return obj
        }
        //判断是否是已代理对象
        if (ldvm.memory.symbolProxy in obj) {
            return obj[ldvm.memory.symbolProxy];
        }


        let handler = {//有的看清类型即可
            //get拦截不到--Object.getOwnPropertyDescriptor().value,要用属性描述符拦截
            get: function (target, prop, receiver) {
                let result
                if (typeof prop === 'symbol' && Symbol.keyFor(prop) === undefined) {
                    return Reflect.get(target, prop, receiver);
                }
                console.log(`{[${objName}]正在获取[${prop.toString()}]}`)
                //typeof null缺陷--typeof null 是'object',用instanceof

                try {
                    result = Reflect.get(target, prop, receiver);
                    //输出对象有缺陷-console.log(`get|obj:[${objName}] -> [${prop.toString()}], ret: [${result}]`)
                    //是对象时，返回类型后， 继续递归调用
                    //是值时， 返回值
                    if (ldvm.toolsFunc.filterProxyProp(prop)) {
                        return result;
                    }
                    let type = ldvm.toolsFunc.getType(result)
                    if (
                        result !== null &&
                        (typeof result === 'object' || typeof result === 'function') &&
                        // ✅ 加这一行，防止重复代理（这才是关键）
                        !result[ldvm.memory.symbolProxy]
                    ) {
                        console.log(`{get|obj:[${objName}] -> [${prop.toString()}], type: [${type}]}`)
                        //递归代理
                        result = ldvm.toolsFunc.proxy(result, `${objName}.${prop.toString()}`)

                    } else if (typeof result == "symbol") {
                        console.log(`{get|obj:[${objName}] -> [${prop.toString()}], ret: [${result.toString()}]}`)
                    }
                    else {
                        console.log(`{get|obj:[${objName}] -> [${prop.toString()}], ret: [${result}]}`)
                    }
                    //throw new Error("测试错误")
                    //resule换成JSON.stringify()--不能输出循环引用的对象···会报错
                } catch (e) {
                    //undefined[prop]等错误
                    console.log(`{get|obj:[${objName}] -> [${prop.toString()}], error: [${e.message}]}`)

                }

                //console.log(`{返回值：${result}}`) 
                /*
                        不要在 Proxy 的 get 里打印 ${result}
                        对象会触发 toString / valueOf / Symbol.toPrimitive
                        → 都会再次触发 get 捕获器
                        → 读取不存在属性 → 返回 undefined → 报错
                        判断对象用：result !== null && typeof result === 'object'
                        比 instanceof 更安全，不会把 null 当成对象
                    
                */
                return result;
            },
            set: function (target, prop, value, receiver) {
                let result;
                try {
                    result = Reflect.set(target, prop, value, receiver)
                    let type = ldvm.toolsFunc.getType(value)
                    if (value instanceof Object) {
                        console.log(`{set|obj:[${objName}] -> prop:[${prop.toString()}],type:[${type}]}`);
                    }
                    else if (typeof value === "symbol") {
                        console.log(`{set|obj:[${objName}] -> prop:[${prop.toString()}],value:[${value.toString()}]}`);
                    }
                    else {
                        console.log(`{set|obj:[${objName}] -> prop:[${prop.toString()}],value:[${value}]}`);
                    }
                }
                catch (e) {
                    console.log(`{set|obj:[${objName}] -> prop:[${prop.toString()}],error:[${e.message}]}`)
                }
                return result
            },
            apply: function(target, thisArg,  args) {
                let result
                try{
                    result = Reflect.apply(target, thisArg,args)
                    let type = ldvm.toolsFunc.getType(result)
                    if(result instanceof Object) {
                        //console.log(`{apply|function:[${objName}],args:[${arguments}],result:[${result}]}`);
                        //参数输出有点复杂--可能是对象，函数，列表等
                        console.log(`{apply|function:[${objName}],args:[${args}],type:[${result}]}`)
                    }
                    else if(typeof result ==='symbol') {
                        console.log(`{apply|function:[${objName}],args:[${args}],result:[${result.toString()}]}`)
                    }
                    else {
                        console.log(`{apply|function:[${objName}],args:[${args}],result:[${result}]}`)
                    }
                    
                }
                catch(e){
                    console.log(`{apply|function:[${objName}],args:[${args}],error:[${e.message}]}`);
                    
                }
                return result
            },
        }

        let proxyObj = new Proxy(obj, handler)
        //判断之前是否被代理
        Object.defineProperty(obj, ldvm.memory.symbolProxy, {
            configurable: false,
            enumerable: false,
            writable: false,
            value: proxyObj
        })
        return proxyObj

    }

    //env函数分发器
    // 修复后的 env 函数分发器
    ldvm.toolsFunc.dispatch = function dispatch(self, obj, objName, funcName, argList, defaultValue) {
        let name = `${objName}_${funcName}`;
        //实现只有document才能调用createElement

        if (Object.getOwnPropertyDescriptor(obj, "constructor") !== undefined) {//obj是原型对象
            if (Object.getOwnPropertyDescriptor(self, "constructor") !== undefined) {
                // self 不是实例对象
                return ldvm.toolsFunc.throwError('TypeError', 'Illegal invocation');
            }
        }
        try {
            // 检查环境函数是否存在
            if (typeof ldvm.envFunc[name] === "function") {
                return ldvm.envFunc[name].apply(self, argList);
            } else {
                console.log(`[${name} 正在执行]，错误信息: 环境函数未定义`);
                return defaultValue;
            }
        } catch (e) {
            if (defaultValue === undefined) {
                console.log(`[${name} 正在执行]，错误信息: ${e.message}`);
            }
            return defaultValue;
        }
    };
    //定义对象属性defineProperty
    ldvm.toolsFunc.defineProperty = function defineProperty(obj, prop, oldDescriptor) {
        let newDescriptor = {}
        //是否可配置与是否开启代理有关
        newDescriptor.configurable = ldvm.config.proxy || oldDescriptor.configurable
        newDescriptor.enumerable = oldDescriptor.enumerable
        if (oldDescriptor.hasOwnProperty("writable")) {
            newDescriptor.writable = ldvm.config.proxy || oldDescriptor.writable;// 如果开启代理必须是true
        }
        if (oldDescriptor.hasOwnProperty("value")) {
            let value = oldDescriptor.value;
            if (typeof value === "function") {
                ldvm.toolsFunc.safeFunc(value, prop);
            }
            newDescriptor.value = value;
        }
        if (oldDescriptor.hasOwnProperty("get")) {
            let get = oldDescriptor.get;
            if (typeof get === "function") {
                ldvm.toolsFunc.safeFunc(get, `get ${prop}`);
            }
            newDescriptor.get = get;
        }
        if (oldDescriptor.hasOwnProperty("set")) {
            let set = oldDescriptor.set;
            if (typeof set === "function") {
                ldvm.toolsFunc.safeFunc(set, `set ${prop}`);
            }
            newDescriptor.set = set;
        }
        Object.defineProperty(obj, prop, newDescriptor)
    }
    //函数native化
    !function () {
        const $toString = Function.prototype.toString;
        const symbol = Symbol(); // 独一无二的属性

        const myToString = function () {
            //调用者是函数---如果调用者有symbol属性则返回，如果调用者没该属性，则返回Function.prototype中的toString
            return typeof this === 'function' && this[symbol] || $toString.call(this);
        }

        function set_native(func, key, value) {
            Object.defineProperty(func, key, {
                enumerable: false,
                configurable: true,
                writable: true,
                value: value
            });
        }

        delete Function.prototype.toString;
        set_native(Function.prototype, "toString", myToString);
        set_native(Function.prototype.toString, symbol, "function toString() { [native code] }");

        ldvm.toolsFunc.setNative = function (func, funcname) {
            set_native(func, symbol, `function ${funcname || func.name || ''}() { [native code] }`);
        }


    }();
    //对象重命名
    ldvm.toolsFunc.reNameObj = function (obj, name) {
        Object.defineProperty(obj.prototype, Symbol.toStringTag, {
            configurable: true,
            enumerable: false,
            value: name,
            writable: false
        })
    }
    // 函数重命名(js补环境中，脱环境不写函数名,要把例如atob的name属性保护起来)
    ldvm.toolsFunc.reNameFunc = function reNameFunc(func, name) {
        Object.defineProperty(func, "name", {
            configurable: true,
            enumerable: false,
            writable: false,
            value: name
        });
    }
    //函数保护方法(native与重命名合并)
    ldvm.toolsFunc.safeFunc = function saveFunc(func, name) {
        ldvm.toolsFunc.setNative(func, name)
        ldvm.toolsFunc.reNameFunc(func, name)
    }
    //保护原型
    ldvm.toolsFunc.safeProto = function savePropto(obj, name) {
        ldvm.toolsFunc.reNameObj(obj, name)
        ldvm.toolsFunc.setNative(obj, name)
    }
    //new Window--抛出错误模拟
    ldvm.toolsFunc.throwError = function throwError(name, message) {
        let e = new Error()
        e.name = name
        e.message = message
        e.stack = `TypeError: Illegal constructor\\n    at snippet://`
        throw e
    }
}()
//浏览器接口实现
!function () {
    ldvm.envFunc.Window_top_get = function Window_top_get() {
        return window;
    };
    ldvm.envFunc.Window_self_get = function Window_self_get() {
        return window;
    };
    ldvm.envFunc.Window_parent_set = function Window_parent_set() {
        return window;
    };
    ldvm.envFunc.Window_self_set = function Window_self_set() { return window; };
}()

//env相关代码
EventTarget = function EventTarget(){}
ldvm.toolsFunc.safeProto(EventTarget, "EventTarget");
Object.setPrototypeOf(EventTarget.prototype, Object.prototype);
WindowProperties = function WindowProperties(){}
ldvm.toolsFunc.safeProto(WindowProperties, "WindowProperties")
Object.setPrototypeOf(WindowProperties.prototype, EventTarget.prototype)
Window = function Window(){
    ldvm.toolsFunc.throwError("TypeError", "Illegal constructor")
}
ldvm.toolsFunc.safeProto(Window, "Window")
Object.setPrototypeOf(Window.prototype, WindowProperties.prototype)


Node = function Node(){ldvm.toolsFunc.throwError("TypeError", "Failed to construct 'Node': Illegal constructor")}
ldvm.toolsFunc.safeProto(Node, "Node");
Object.setPrototypeOf(Node.prototype, EventTarget.prototype);

const Element = function Element() {
  ldvm.toolsFunc.throwError("TypeError", "Failed to construct 'Element': Illegal constructor");
};
ldvm.toolsFunc.safeProto(Element, "Element");
Object.setPrototypeOf(Element.prototype, Node.prototype);


Document = function Document(){}
ldvm.toolsFunc.safeProto(Document, "Document");
Object.setPrototypeOf(Document.prototype, Node.prototype);
HTMLDocument = function HTMLDocument(){ldvm.toolsFunc.throwError("TypeError", "Failed to construct 'HTMLDocument': Illegal constructor")}
ldvm.toolsFunc.safeProto(HTMLDocument, "HTMLDocument");
Object.setPrototypeOf(HTMLDocument.prototype, Document.prototype);
document = {};
Object.setPrototypeOf(document,HTMLDocument.prototype );
Object.defineProperty(document, "location", {
    configurable: false, 
    enumerable: true, 
    get: function() {
        return ldvm.toolsFunc.dispatch(this, document, "document", "location_get", arguments, "123")
    },
    set: function() {
        return ldvm.toolsFunc.dispatch(this, document, "document", "location_get",arguments)
    }
})
ldvm.toolsFunc.defineProperty(Document.prototype, "documentElement", {configurable:true, enumerable:true, get: function (){return ldvm.toolsFunc.dispatch(this, Document.prototype, "Document", "documentElement_get", arguments)},set:undefined});


Navigator = function Navigator(){ldvm.toolsFunc.throwError("TypeError", "Failed to construct 'Navigator': Illegal constructor")}
ldvm.toolsFunc.safeProto(Navigator, "Navigator");
Object.setPrototypeOf(Navigator.prototype, Object.prototype);
navigator = {};
Object.setPrototypeOf(navigator, Navigator.prototype); 

Storage = function Storage(){ldvm.toolsFunc.throwError("TypeError", "Failed to construct 'Storage': Illegal constructor")}
ldvm.toolsFunc.safeProto(Storage, "Storage");
Object.setPrototypeOf(Storage.prototype, Object.prototype);
localStorage = {};
Object.setPrototypeOf(localStorage, Storage.prototype); 
sessionStorage = {};
Object.setPrototypeOf(sessionStorage, Storage.prototype); 

Location = function Location(){ldvm.toolsFunc.throwError("TypeError", "Failed to construct 'Location': Illegal constructor")}
ldvm.toolsFunc.safeProto(Location, "Location");
Object.setPrototypeOf(Location.prototype, Object.prototype);
location = {};
Object.setPrototypeOf(location, Location.prototype); 

History = function History(){ldvm.toolsFunc.throwError("TypeError", "Failed to construct 'History': Illegal constructor")}
ldvm.toolsFunc.safeProto(History, "History");
Object.setPrototypeOf(History.prototype, Object.prototype);
history = {};
Object.setPrototypeOf(history, History.prototype); 

Performance = function Performance(){ldvm.toolsFunc.throwError("TypeError", "Failed to construct 'Performance': Illegal constructor")}
ldvm.toolsFunc.safeProto(Performance, "Performance");
Object.setPrototypeOf(Performance.prototype, EventTarget.prototype);
performance = {};
Object.setPrototypeOf(performance, Performance.prototype); 

//window对象
window = globalThis
delete global
delete Buffer
delete globalThis[Symbol.toStringTag];
delete WindowProperties.prototype.constructor
Object.setPrototypeOf(window, Window.prototype)
ldvm.toolsFunc.defineProperty(window, "atob", {
    configurable: true, 
    enumerable: true, 
    writable: true,
    value: function atob(str){
        return ldvm.toolsFunc.base64.base64decode(str)
    }
})
ldvm.toolsFunc.defineProperty(window, "btoa", {
    configurable: true, 
    enumerable: true, 
    writable: true,
    value: function btoa(str){
        return ldvm.toolsFunc.base64.base64encode(str)
    }
})
ldvm.toolsFunc.defineProperty(Window, "PERSISTENT", {
    configurable: false,
    enumerable: true,
    value: 1,
    writable: false
});
ldvm.toolsFunc.defineProperty(Window, "TEMPORARY", {
    configurable: false,
    enumerable: true,
    value: 0,
    writable: false
});
ldvm.toolsFunc.defineProperty(Window.prototype, "PERSISTENT", {
    configurable: false,
    enumerable: true,
    value: 1,
    writable: false
});
ldvm.toolsFunc.defineProperty(Window.prototype, "TEMPORARY", {
    configurable: false,
    enumerable: true,
    value: 0,
    writable: false
});
ldvm.toolsFunc.defineProperty(window, "name", {configurable:true, enumerable:true, get: function (){return ldvm.toolsFunc.dispatch(this, undefined, "Window", "name_get", arguments, '')}, set: function (){return ldvm.toolsFunc.dispatch(this, undefined, "Window", "name_set", arguments)}}); 
ldvm.toolsFunc.defineProperty(window, "top", {configurable:false, enumerable:true, get: function (){return ldvm.toolsFunc.dispatch(this, window, "Window", "top_get", arguments)},set:undefined}); 
ldvm.toolsFunc.defineProperty(window, "self", {configurable:true, enumerable:true, get: function (){return ldvm.toolsFunc.dispatch(this, window, "Window", "self_get", arguments)},set: function (){return ldvm.toolsFunc.dispatch(this, window, "Window", "self_set", arguments)}}); 
ldvm.toolsFunc.defineProperty(window, "parent", {configurable:true, enumerable:true, get: function (){return ldvm.toolsFunc.dispatch(this, window, "Window", "parent_get", arguments)},set: function (){return ldvm.toolsFunc.dispatch(this, window, "Window", "parent_set", arguments)}}); 
eval = ldvm.toolsFunc.hook(eval, undefined, false, function(){}, function(){}).bind(window)
ldvm.toolsFunc.defineProperty(window, "self", {
    configurable:true, enumerable:true, 
    get: function (){return ldvm.toolsFunc.dispatch(this, window, "Window", "self_get", arguments)},
    set: function (){return ldvm.toolsFunc.dispatch(this, window, "Window", "self_set", arguments)}
}); 
ldvm.toolsFunc.defineProperty(window, "parent", {
    configurable:true, enumerable:true, 
    get: function (){return ldvm.toolsFunc.dispatch(this, window, "Window", "parent_get", arguments)},
    set: function (){return ldvm.toolsFunc.dispatch(this, window, "Window", "parent_set", arguments)}
}); 


//全局变量初始化
!function () {
    let onEnter = function (obj) {
        try {
            ldvm.toolsFunc.printLog(obj.args);
        }
        catch (e) {

        }


    }
    console.log = ldvm.toolsFunc.hook(
        console.log,
        undefined,
        false,
        onEnter,
        function () { },
        ldvm.config.print
    );
   

}();

//用户代码
//网页变量初始化
!function() {
    
}()

//需要代理的对象
window = top = self = parent = ldvm.toolsFunc.proxy(window, "window")
document = ldvm.toolsFunc.proxy(document, "document")
navigator = ldvm.toolsFunc.proxy(navigator, "navigator")
location = ldvm.toolsFunc.proxy(location, "location")
history = ldvm.toolsFunc.proxy(history, "history")  
performance = ldvm.toolsFunc.proxy(performance, "performance")  
localStorage = ldvm.toolsFunc.proxy(localStorage, 'localStorage');
globlaThis = window

//用户代码
//用户代码

//用户代码
//console.log(window, window === this)
//.log(this)
// console.log(globalThis === window)
// console.log(globalThis === this)
// console.log(module.exports === this)
console.log(globalThis.Window === Window);
console.log(Reflect);
