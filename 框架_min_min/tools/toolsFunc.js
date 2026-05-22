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