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
//工具函数代码
!function () {
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
    ldvm.toolsFunc.getID = function getID() {
        if (ldvm.memory.ID === undefined) {
            ldvm.memory.ID = 0;
        }
        ldvm.memory.ID += 1;
        return ldvm.memory.ID;
    }
    ldvm.toolsFunc.createProxyObj = function createProxyObj(obj, proto, name) {
        Object.setPrototypeOf(obj, proto.prototype);
        return ldvm.toolsFunc.proxy(obj, `${name}_ID(${ldvm.toolsFunc.getID()})`);
    }
    ldvm.toolsFunc.hook = function (func, funcInfo, isDebug, onEnter, onLeave, isExec) {
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
        ldvm.toolsFunc.setNative(hookFunc, funcInfo.funcName)
        ldvm.toolsFunc.reNameFunc(hookFunc, funcInfo.funcName)
        hookFunc.length = func.length
        hookFunc.prototype = func.prototype
        return hookFunc
    }
    ldvm.toolsFunc.getType = function (obj) {
        return Object.prototype.toString.call(obj)
    }
    ldvm.toolsFunc.filterProxyProp = function filterProxyProp(prop) {
        for (let i = 0; i < ldvm.memory.filterProxyProp.length; i++) {
            if (ldvm.memory.filterProxyProp[i] === prop) {
                return true
            }
        }
        return false
    }
    ldvm.toolsFunc.proxy = function (obj, objName) {
        if (!ldvm.config.proxy) {
            return obj
        }
        if (ldvm.memory.symbolProxy in obj) {
            return obj[ldvm.memory.symbolProxy];
        }
        let handler = {
            get: function (target, prop, receiver) {
                let result
                if (typeof prop === 'symbol' && Symbol.keyFor(prop) === undefined) {
                    return Reflect.get(target, prop, receiver);
                }
                try {
                    result = Reflect.get(target, prop, receiver);
                    if (ldvm.toolsFunc.filterProxyProp(prop)) {
                        return result;
                    }
                    let type = ldvm.toolsFunc.getType(result)
                    if (
                        result !== null &&
                        (typeof result === 'object' || typeof result === 'function') &&
                        !result[ldvm.memory.symbolProxy]
                    ) {
                        console.log(`{get|obj:[${objName}] -> [${prop.toString()}], type: [${type}]}`)
                        result = ldvm.toolsFunc.proxy(result, `${objName}.${prop.toString()}`)
                    } else if (typeof result == "symbol") {
                        console.log(`{get|obj:[${objName}] -> [${prop.toString()}], ret: [${result.toString()}]}`)
                    }
                    else {
                        console.log(`{get|obj:[${objName}] -> [${prop.toString()}], ret: [${result}]}`)
                    }
                } catch (e) {
                    console.log(`{get|obj:[${objName}] -> [${prop.toString()}], error: [${e.message}]}`)
                }
                return result;
            },
            set: function (target, prop, value, receiver) {
                let result;
                try {
                    const readOnlyProps = ['undefined', 'NaN', 'Infinity']
                    if (target === window && readOnlyProps.includes(prop)) {
                        return false
                    }
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
            getOwnPropertyDescriptor: function (target, prop) {
                let result;
                try {
                    result = Reflect.getOwnPropertyDescriptor(target, prop)
                    let type = ldvm.toolsFunc.getType(result)
                    if ("constructor" !== prop) {
                        console.log(`{getOwnPropertyDescriptor|obj}:[${objName}] -> prop:[${prop.toString()}],type:[${type}]`);
                    }
                    if (typeof result !== "undefined") {
                        ldvm.toolsFunc.proxy(result, `${objName}.${prop.toString()}.PropertyDescriptor`)
                    }
                }
                catch (e) {
                    console.log(`{getOwnPropertyDescriptor|obj:[${objName}] -> [${prop.toString()}], error: [${e.message}]}`)
                }
                return result
            },
            defineProperty: function (target, prop, descriptor) {
                let result
                try {
                    result = Reflect.defineProperty(target, prop, descriptor)
                    console.log(`{defineProperty|obj:[${objName}] -> prop:[${prop.toString()}]}`);
                }
                catch (e) {
                    console.log(`{defineProperty|obj:[${objName}] -> [${prop.toString()}], error: [${e.message}]}`)
                }
                return result
            },
            apply: function (target, thisArg, args) {
                let result
                try {
                    result = Reflect.apply(target, thisArg, args)
                    let type = ldvm.toolsFunc.getType(result)
                    if (result instanceof Object) {
                        console.log(`{apply|function:[${objName}],args:[${args}],type:[${result}]}`)
                    }
                    else if (typeof result === 'symbol') {
                        console.log(`{apply|function:[${objName}],args:[${args}],result:[${result.toString()}]}`)
                    }
                    else {
                        console.log(`{apply|function:[${objName}],args:[${args}],result:[${result}]}`)
                    }
                }
                catch (e) {
                    console.log(`{apply|function:[${objName}],args:[${args}],error:[${e.message}]}`);
                }
                return result
            },
            construct: function (target, argArray, newTarget) {
                let result
                try {
                    result = Reflect.construct(target, argArray, newTarget)
                    let type = ldvm.toolsFunc.getType(result)
                    console.log(`{construct|function:[${objName}],type:[${type}]}`)
                }
                catch (e) {
                    console.log(`{construct|function:[${objName}],error:[${e.message}]}`);
                }
                return result
            },
            deleteProperty: function (target, propKey) {
                let result = Reflect.deleteProperty(target, propKey)
                console.log(`{deleteProperty|obj:[${objName}] -> prop:[${propKey.toString()}], result:[${result}]}`)
                return result
            },
            has: function (target, propKey) {
                let result = Reflect.has(target, propKey)
                console.log(`{has|obj:[${objName}] -> prop:[${propKey.toString()}], result:[${result}]}`);
                return result
            },
            ownKeys: function (target) {
                let result = Reflect.ownKeys(target);
                console.log(`{ownKeys|obj:[${objName}]}`);
                return result;
            },
            getPrototypeOf: function (target) {
                let result = Reflect.getPrototypeOf(target);
                console.log(`{getPrototypeOf|obj:[${objName}]}`);
                return result;
            },
            setPrototypeOf: function (target, proto) {
                let result = Reflect.setPrototypeOf(target, proto);
                console.log(`{setPrototypeOf|obj:[${objName}]}`);
                return result;
            }
        }
        let proxyObj = new Proxy(obj, handler)
        Object.defineProperty(obj, ldvm.memory.symbolProxy, {
            configurable: false,
            enumerable: false,
            writable: false,
            value: proxyObj
        })
        return proxyObj
    }
    ldvm.toolsFunc.dispatch = function dispatch(self, obj, objName, funcName, argList, defaultValue) {
        let name = `${objName}_${funcName}`;
        const proto = obj.prototype || obj;
        if (!(self instanceof proto.constructor)) {
            return ldvm.toolsFunc.throwError('TypeError', 'Illegal invocation');
        }

        try {
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
    ldvm.toolsFunc.defineProperty = function defineProperty(obj, prop, oldDescriptor) {
        let newDescriptor = {}
        newDescriptor.configurable = ldvm.config.proxy || oldDescriptor.configurable
        newDescriptor.enumerable = oldDescriptor.enumerable
        if (oldDescriptor.hasOwnProperty("writable")) {
            newDescriptor.writable = ldvm.config.proxy || oldDescriptor.writable;
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
    !function () {
        const $toString = Function.prototype.toString;
        const symbol = Symbol();
        const myToString = function () {
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
    ldvm.toolsFunc.reNameObj = function (obj, name) {
        Object.defineProperty(obj.prototype, Symbol.toStringTag, {
            configurable: true,
            enumerable: false,
            value: name,
            writable: false
        })
    }
    ldvm.toolsFunc.reNameFunc = function reNameFunc(func, name) {
        Object.defineProperty(func, "name", {
            configurable: true,
            enumerable: false,
            writable: false,
            value: name
        });
    }
    ldvm.toolsFunc.safeFunc = function saveFunc(func, name) {
        ldvm.toolsFunc.setNative(func, name)
        ldvm.toolsFunc.reNameFunc(func, name)
    }
    ldvm.toolsFunc.safeProto = function savePropto(obj, name) {
        ldvm.toolsFunc.reNameObj(obj, name)
        ldvm.toolsFunc.setNative(obj, name)
    }
    ldvm.toolsFunc.throwError = function throwError(name, message) {
        let e = new Error()
        e.name = name
        e.message = message
        if (typeof Error.captureStackTrace === 'function') {
            Error.captureStackTrace(e, throwError);
        } else {
            if (e.stack) {
                const stackLines = e.stack.split('\n');
                e.stack = stackLines.slice(1).join('\n');
            }
        }
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
    ldvm.envFunc.Window_self_set = function Window_self_set() { 
        this.self = arguments[0]
        return window; 
    };
    ldvm.envFunc.Window_parent_set = function Window_parent_set() {
        this.self = arguments[0]
        return window;
    };
    ldvm.envFunc.Window_top_set = function Window_top_set() {
        this.top = arguments[0]
        return window;
    };
    ldvm.envFunc.Window_parent_get = function Window_parent_get() {
        return window;
    };
   
}()

//env相关代码
EventTarget = function EventTarget(){}
ldvm.toolsFunc.safeProto(EventTarget, "EventTarget");
Object.setPrototypeOf(EventTarget.prototype, Object.prototype);
WindowProperties = function WindowProperties(){}
ldvm.toolsFunc.safeProto(WindowProperties, "WindowProperties")
Object.setPrototypeOf(WindowProperties.prototype, EventTarget.prototype)
Window = function Window(){
    ldvm.toolsFunc.throwError("TypeError", "Failed to construct 'Window': Illegal constructor")
}
ldvm.toolsFunc.safeProto(Window, "Window")
Object.setPrototypeOf(Window.prototype, WindowProperties.prototype)


Node = function Node(){ldvm.toolsFunc.throwError("TypeError", "Failed to construct 'Node': Illegal constructor")}
ldvm.toolsFunc.safeProto(Node, "Node");
Object.setPrototypeOf(Node.prototype, EventTarget.prototype);

Element = function Element() {
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

Screen = function Screen(){ldvm.toolsFunc.throwError("TypeError", "Failed to construct 'Screen': Illegal constructor")}
ldvm.toolsFunc.safeProto(Screen, "Screen");
Object.setPrototypeOf(Screen.prototype, EventTarget.prototype);
ldvm.toolsFunc.defineProperty(Screen.prototype, "availWidth", {configurable:true, enumerable:true, get: function (){return ldvm.toolsFunc.dispatch(this, Screen.prototype, "Screen", "availWidth_get", arguments)},set:undefined});
ldvm.toolsFunc.defineProperty(Screen.prototype, "availHeight", {configurable:true, enumerable:true, get: function (){return ldvm.toolsFunc.dispatch(this, Screen.prototype, "Screen", "availHeight_get", arguments)},set:undefined});
ldvm.toolsFunc.defineProperty(Screen.prototype, "width", {configurable:true, enumerable:true, get: function (){return ldvm.toolsFunc.dispatch(this, Screen.prototype, "Screen", "width_get", arguments)},set:undefined});
ldvm.toolsFunc.defineProperty(Screen.prototype, "height", {configurable:true, enumerable:true, get: function (){return ldvm.toolsFunc.dispatch(this, Screen.prototype, "Screen", "height_get", arguments)},set:undefined});
ldvm.toolsFunc.defineProperty(Screen.prototype, "colorDepth", {configurable:true, enumerable:true, get: function (){return ldvm.toolsFunc.dispatch(this, Screen.prototype, "Screen", "colorDepth_get", arguments)},set:undefined});
ldvm.toolsFunc.defineProperty(Screen.prototype, "pixelDepth", {configurable:true, enumerable:true, get: function (){return ldvm.toolsFunc.dispatch(this, Screen.prototype, "Screen", "pixelDepth_get", arguments)},set:undefined});
ldvm.toolsFunc.defineProperty(Screen.prototype, "availLeft", {configurable:true, enumerable:true, get: function (){return ldvm.toolsFunc.dispatch(this, Screen.prototype, "Screen", "availLeft_get", arguments)},set:undefined});
ldvm.toolsFunc.defineProperty(Screen.prototype, "availTop", {configurable:true, enumerable:true, get: function (){return ldvm.toolsFunc.dispatch(this, Screen.prototype, "Screen", "availTop_get", arguments)},set:undefined});
ldvm.toolsFunc.defineProperty(Screen.prototype, "orientation", {configurable:true, enumerable:true, get: function (){return ldvm.toolsFunc.dispatch(this, Screen.prototype, "Screen", "orientation_get", arguments)},set:undefined});
ldvm.toolsFunc.defineProperty(Screen.prototype, "onchange", {configurable:true, enumerable:true, get: function (){return ldvm.toolsFunc.dispatch(this, Screen.prototype, "Screen", "onchange_get", arguments)},set: function (){return ldvm.toolsFunc.dispatch(this, Screen.prototype, "Screen", "onchange_set", arguments)}});
ldvm.toolsFunc.defineProperty(Screen.prototype, "isExtended", {configurable:true, enumerable:true, get: function (){return ldvm.toolsFunc.dispatch(this, Screen.prototype, "Screen", "isExtended_get", arguments)},set:undefined});

screen = {};
Object.setPrototypeOf(screen, Screen.prototype); 

// chrome对象
chrome = {};
ldvm.toolsFunc.defineProperty(chrome, "loadTimes", {configurable:true, enumerable:true, writable:true, value: function (){return ldvm.toolsFunc.dispatch(this, chrome, "undefined", "loadTimes", arguments)}}); 
ldvm.toolsFunc.defineProperty(chrome, "csi", {configurable:true, enumerable:true, writable:true, value: function (){return ldvm.toolsFunc.dispatch(this, chrome, "undefined", "csi", arguments)}}); 
ldvm.toolsFunc.defineProperty(chrome, "app", {configurable:true, enumerable:true, writable:true, value: {}}); 

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
ldvm.toolsFunc.defineProperty(window, "top", {configurable:false, enumerable:true, get: function (){return ldvm.toolsFunc.dispatch(this, window, "Window", "top_get", arguments)},set: function (){return ldvm.toolsFunc.dispatch(this, window, "Window", "top_set", arguments)}}); 
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
chrome = ldvm.toolsFunc.proxy(chrome, 'chrome');
globalThis = window

//用户代码
//用户代码
//;(function() {用户代码}).call(window)
top
window.top 

//用户代码

