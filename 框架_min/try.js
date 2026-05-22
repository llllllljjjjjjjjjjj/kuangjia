ldvm = {
    memory: {
        symbolProxy: Symbol('isProxy'),
        filterProxyProp: ['length', 'size', 'byteLength', 'byteOffset'] // 过滤掉一些访问频率高但不需要代理的属性
    },
    toolsFunc: {}
}
ldvm.config = {}
ldvm.config.proxy = true
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
                /*
                    不要在 Proxy 的 get 里打印 ${result}
                    对象会触发 toString / valueOf / Symbol.toPrimitive
                    → 都会再次触发 get 捕获器
                    → 读取不存在属性 → 返回 undefined → 报错
                    判断对象用：result !== null && typeof result === 'object'
                    比 instanceof 更安全，不会把 null 当成对象
                
                */

            }

            //console.log(`{返回值：${result}}`)
            return result;
        },

        //不写 set：自带完整默认赋值行为
        // 写了 set：默认操作全部消失
        // 想恢复默认：必须手动调用 Reflect.set
        // 顺序必须是：(target, prop, value, receiver)
        set: function (target, prop, value, receiver) {
            let result;
            try {
                result = Reflect.set(target, prop, value, receiver)
                let type = ldvm.toolsFunc.getType(value)
                if (value instanceof Object) {
                    //
                    //vaule = ldvm.toolsFunc.proxy(value, `${objName}.${prop.toString()}`)
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
        //拦截属性描符
    //     getOwnPropertyDescriptor: function (target, prop) {
    //         let result;
    //         try {
    //             result = Reflect.getOwnPropertyDescriptor(target, prop)
    //             let type = ldvm.toolsFunc.getType(result)
    //             if ("constructor" !== prop) {
    //                 console.log(`{getOwnPropertyDescriptor|obj}:[${objName}] -> prop:[${prop.toString()}],type:[${type}]`);
    //             }

    //             //如果result是对象，还要拦截对象属性描述符对象
    //             if (typeof result !== "undefined") {
    //                 //所有对象的属性（包括内置对象的属性）都有PropertyDescriptor，只是你需要用 Object.getOwnPropertyDescriptor() 来读取它。
    //                 result = ldvm.toolsFunc.proxy(result, `${objName}.${prop.toString()}.PropertyDescriptor`)
    //             }
    //         }
    //         catch (e) {
    //             console.log(`{getOwnPropertyDescriptor|obj:[${objName}] -> [${prop.toString()}], error: [${e.message}]}`)

    //         }
    //         return result
    //     },
    //     //拦截定义属性
    //     defineProperty: function (target, prop, descriptor) {
    //         let result
    //         try {
    //             result = Reflect.defineProperty(target, prop, descriptor)
    //             console.log(`{defineProperty|obj:[${objName}] -> prop:[${prop.toString()}]}`);
    //         }
    //         catch (e) {
    //             console.log(`{defineProperty|obj:[${objName}] -> [${prop.toString()}], error: [${e.message}]}`)

    //         }
    //         return result
    //     },
    //     //拦截函数，这里的的target指函数，前面的target指对象; thisArg-谁调用了函数
    //     apply: function (target, thisArg, args) {
    //         let result
    //         try {
    //             result = Reflect.apply(target, thisArg, args)
    //             let type = ldvm.toolsFunc.getType(result)
    //             if (result instanceof Object) {
    //                 //console.log(`{apply|function:[${objName}],args:[${arguments}],result:[${result}]}`);
    //                 //参数输出有点复杂--可能是对象，函数，列表等
    //                 console.log(`{apply|function:[${objName}],args:[${args}],type:[${result}]}`)
    //             }
    //             else if (typeof result === 'symbol') {
    //                 console.log(`{apply|function:[${objName}],args:[${args}],result:[${result.toString()}]}`)
    //             }
    //             else {
    //                 console.log(`{apply|function:[${objName}],args:[${args}],result:[${result}]}`)
    //             }

    //         }
    //         catch (e) {
    //             console.log(`{apply|function:[${objName}],args:[${args}],error:[${e.message}]}`);

    //         }
    //         return result
    //     },
    //     //函数创建拦截
    //     construct: function (target, argArray, newTarget) {
    //         //target--函数对象
    //         //argArray--参数列表
    //         //newTarget--代理对象
    //         let result
    //         try {
    //             result = Reflect.construct(target, argArray, newTarget)
    //             let type = ldvm.toolsFunc.getType(result)
    //             console.log(`{construct|function:[${objName}],type:[${type}]}`)
    //         }
    //         catch (e) {
    //             console.log(`{construct|function:[${objName}],error:[${e.message}]}`);
    //         }
    //         return result
    //     },
    //     //删除属性拦截
    //     deleteProperty: function (target, propKey) {
    //         let result = Reflect.deleteProperty(target, propKey)
    //         console.log(`{deleteProperty|obj:[${objName}] -> prop:[${propKey.toString()}], result:[${result}]}`)
    //         return result
    //     },
    //     has: function (target, propKey) {
    //         let result = Reflect.has(target, propKey)
    //         console.log(`{has|obj:[${objName}] -> prop:[${propKey.toString()}], result:[${result}]}`);
    //         return result
    //     },
    //     //遍历拦截
    //     ownKeys: function (target) {
    //         let result = Reflect.ownKeys(target);
    //         console.log(`{ownKeys|obj:[${objName}]}`);
    //         return result;
    //     },
    //     //获取原型对象
    //     getPrototypeOf: function (target) {
    //         let result = Reflect.getPrototypeOf(target);
    //         console.log(`{getPrototypeOf|obj:[${objName}]}`);
    //         return result;
    //     },
    //     //设置原型对象
    //     setPrototypeOf: function (target, proto) {
    //         let result = Reflect.setPrototypeOf(target, proto);
    //         console.log(`{setPrototypeOf|obj:[${objName}]}`);
    //         return result;
    //     },


    //     // preventExtensions: function(target) {
    //     //     let result = Reflect.preventExtensions(target);
    //     //     console.log(`{preventExtensions|obj:[${objName}]}`);
    //     //     return result;
    //     // },
    //     // isExtensible: function(target) {
    //     //     let result = Reflect.isExtensible(target);
    //     //     console.log(`{isExtensible|obj:[${objName}]}`);
    //     //     return result;
    //     // }
    };
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
window = globalThis
window = ldvm.toolsFunc.proxy(window, 'window')
//window.name = "Window"
//Object.getOwnPropertyDescriptor(window, "name").vaule
// window.a1111 = 'sdk'
window.b1111 = {
    name: "b1111"
}
window.b1111.name
// window.b1111.name = "11"
// console.log(globalThis.name)

//window.c1111.name
let b = {}
let a = {}
a.b = b   // a 引用 b
b.a = a   // b 引用 a

// 2. 用你的 proxy 代理
let p = ldvm.toolsFunc.proxy(a, 'root')

// 3. 只要一读任何一边 → 立刻栈溢出！
p.b