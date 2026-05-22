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
ldvm.memory.globalVar.jsonCookie = {}//存储全局变量
ldvm.memory.globalVar.gontList = ["SimHei", "SimSun", "NSimSun", "FangSong", "KaiTi"]//认为浏览器能够识别字体
//工具函数代码
//工具代码
!function(){
    // 获取原型对象上自身属性值
    ldvm.toolsFunc.getProtoArr = function getProtoArr(key){
        return this[ldvm.memory.symbolData] && this[ldvm.memory.symbolData][key];
    }

    ldvm.toolsFunc.setProtoArr = function setProtoArr(key, value){
        if(!(ldvm.memory.symbolData in this)){
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
    ldvm.toolsFunc.getID = function getID(){
        if(ldvm.memory.ID === undefined){
            ldvm.memory.ID = 0;
        }
        ldvm.memory.ID += 1;
        return ldvm.memory.ID;
    }

    //设置实例对象的原型与代理
    ldvm.toolsFunc.createProxyObj = function createProxyObj(obj, proto, name){
        Object.setPrototypeOf(obj,proto.prototype);
        //ID是为了区分不同的div标签
        return ldvm.toolsFunc.proxy(obj, `${name}_ID(${ldvm.toolsFunc.getID()})`);
    }
    
    //hook
    ldvm.toolsFunc.hook = function(func, funcInfo, isDebug, onEnter, onLeave, isExec){
    //func-原函数
    //funcInfo-含objName(目标函数所属的对象的名)、funcName(目标函数在对象上的属性名)属性的对象
    //isDebug-布尔类型， 是否进行调试， 关键点定位， 回溯调用栈
    //onEnter-函数，原函数执行前的操作-输出入参、改原函数入参···
    //onLeave-函数，原函数执行后的操作-输出原函数的返回值、改原函数返回值
    //isExec-布尔类型，是否执行原函数，比如无限debugger
    if(typeof func !== 'function') {
        return func;
    }
    if(funcInfo === undefined) {
        funcInfo = {};
        funcInfo.objName = 'globalThis'
        funcInfo.funcName = func.name || ''
    }    
    if(isDebug === undefined) {
        isDebug = false
    }
    if(!onEnter) {
        onEnter = function (obj) {
            console.log(`{hook|${funcInfo.objName}[${funcInfo.funcName}]正在调用， 参数是${JSON.stringify(obj.args)}`)
        } 
    }
    if(!onLeave) {
        onLeave = function(obj) {
            console.log(`{hook|${funcInfo.objName}[${funcInfo.funcName}]正在调用， 返回值是${obj.result}`)

        }
    }
    if(isExec === undefined) {
        isExec = true
    }
    let hookFunc = function() {
        if(isDebug) {
            debugger
        }
        let obj = {}
        obj.args = []
        for(let i = 0; i < arguments.length; i++) {
            obj.args[i] = arguments[i];
        }
        onEnter.call(this, obj)
        let result
        if(isExec) {
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
    
    //代理器
    // ---获取类型
    ldvm.toolsFunc.getType = function (obj) {
        // 遇到代理对象直接返回类型，不调用 toString
        //   if (obj instanceof Proxy) {
        //     return '[object Proxy]'
        //   }
        return Object.prototype.toString.call(obj)
    }
    // ---过滤属性
    ldvm.toolsFunc.filterProxyProp = function filterProxyProp(prop) {
        for(let i = 0; i < ldvm.memory.filterProxyProp.length; i++) {
            if(ldvm.memory.filterProxyProp[i] === prop){
                return true
            }
        }
        return false
    }
    ldvm.toolsFunc.proxy = function (obj, objName) {
        //obj:原始对象
        //objName:原始对象名字
        if(!ldvm.config.proxy) {
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
                
                try{
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
                        console.log(`get|obj:[${objName}] -> [${prop.toString()}], type: [${type}]`)
                        //递归代理
                        result = ldvm.toolsFunc.proxy(result, `${objName}.${prop.toString()}`)
                    
                    }else if(typeof result == "symbol"){
                        console.log(`get|obj:[${objName}] -> [${prop.toString()}], ret: [${result.toString()}]`)
                    }
                    else{
                        console.log(`get|obj:[${objName}] -> [${prop.toString()}], ret: [${result}]`)
                    }
                    //throw new Error("测试错误")
                    //resule换成JSON.stringify()--不能输出循环引用的对象···会报错
                }catch(e){
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

                console.log(`{返回值：${result}}`)
                return result;
            },
            
            //不写 set：自带完整默认赋值行为
            // 写了 set：默认操作全部消失
            // 想恢复默认：必须手动调用 Reflect.set
            // 顺序必须是：(target, prop, value, receiver)
            set: function(target, prop, value, receiver) {
                let result;
                try{
                    result = Reflect.set(target, prop, value, receiver)
                    let type = ldvm.toolsFunc.getType(value)
                    if(value instanceof Object) {
                        console.log(`{set|obj:[${objName}] -> prop:[${prop.toString()}],type:[${type}]}`);
                    }
                    else if(typeof value === "symbol"){
                        console.log(`{set|obj:[${objName}] -> prop:[${prop.toString()}],value:[${value.toString()}]}`);
                    }
                    else {
                        console.log(`{set|obj:[${objName}] -> prop:[${prop.toString()}],value:[${value}]}`);
                    }
                }
                catch(e){
                    console.log(`{set|obj:[${objName}] -> prop:[${prop.toString()}],error:[${e.message}]}`)
                }
                return result
            },
            //拦截属性描符
            getOwnPropertyDescriptor: function(target, prop) {
                let result;
                try {
                    result = Reflect.getOwnPropertyDescriptor(target, prop)
                    let type = ldvm.toolsFunc.getType(result)
                    if ("constructor" !== prop) {
                        console.log(`{getOwnPropertyDescriptor|obj}:[${objName}] -> prop:[${prop.toString()}],type:[${type}]`);
                    }
                    
                    //如果result是对象，还要拦截对象属性描述符对象
                    if(typeof result !== "undefined") {
                        //所有对象的属性（包括内置对象的属性）都有PropertyDescriptor，只是你需要用 Object.getOwnPropertyDescriptor() 来读取它。
                        ldvm.toolsFunc.proxy(result, `${objName}.${prop.toString()}.PropertyDescriptor`)
                    }
                }
                catch(e){
                    console.log(`{getOwnPropertyDescriptor|obj:[${objName}] -> [${prop.toString()}], error: [${e.message}]}`)

                }
                return result
            },
            //拦截定义属性
            defineProperty: function(target, prop, descriptor) {
                let result
                try {
                    result = Reflect.defineProperty(target, prop, descriptor)
                    console.log(`{defineProperty|obj:[${objName}] -> prop:[${prop.toString()}]}`);
                }
                catch(e){
                    console.log(`{defineProperty|obj:[${objName}] -> [${prop.toString()}], error: [${e.message}]}`)

                }
                return result
            },
            //拦截函数，这里的的target指函数，前面的target指对象; thisArg-谁调用了函数
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
            //函数创建拦截
            construct: function(target, argArray, newTarget) {
                //target--函数对象
                //argArray--参数列表
                //newTarget--代理对象
                let result
                try{
                    result = Reflect.construct(target, argArray, newTarget)
                    let type = ldvm.toolsFunc.getType(result)
                    console.log(`{construct|function:[${objName}],type:[${type}]}`)
                }
                catch(e){
                    console.log(`{construct|function:[${objName}],error:[${e.message}]}`);
                }
                return result
            },
            //删除属性拦截
            deleteProperty: function(target, propKey) {
                let result = Reflect.deleteProperty(target, propKey)
                console.log(`{deleteProperty|obj:[${objName}] -> prop:[${propKey.toString()}], result:[${result}]}`)
                return result
            },
            has:function(target, propKey) {
                let result = Reflect.has(target, propKey)
                console.log(`{has|obj:[${objName}] -> prop:[${propKey.toString()}], result:[${result}]}`);
                return result
            },
            //遍历拦截
            ownKeys: function (target) {
            let result = Reflect.ownKeys(target);
            console.log(`{ownKeys|obj:[${objName}]}`);
            return result;
            },
            //获取原型对象
            getPrototypeOf: function(target) {
                let result = Reflect.getPrototypeOf(target);
                console.log(`{getPrototypeOf|obj:[${objName}]}`);
                return result;
            },
            //设置原型对象
            setPrototypeOf: function(target, proto) {
                let result = Reflect.setPrototypeOf(target, proto);
                console.log(`{setPrototypeOf|obj:[${objName}]}`);
                return result;
            },
            
            
            // preventExtensions: function(target) {
            //     let result = Reflect.preventExtensions(target);
            //     console.log(`{preventExtensions|obj:[${objName}]}`);
            //     return result;
            // },
            // isExtensible: function(target) {
            //     let result = Reflect.isExtensible(target);
            //     console.log(`{isExtensible|obj:[${objName}]}`);
            //     return result;
            // }
        };
        let proxyObj = new Proxy(obj, handler)
        //判断之前是否被代理
        Object.defineProperty(obj, ldvm.memory.symbolProxy,  {
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
        
        if(Object.getOwnPropertyDescriptor(obj, "constructor") !== undefined){//obj是原型对象
            if(Object.getOwnPropertyDescriptor(self, "constructor") !== undefined){
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
        if(oldDescriptor.hasOwnProperty("writable")){
            newDescriptor.writable = ldvm.config.proxy || oldDescriptor.writable;// 如果开启代理必须是true
        }
        if(oldDescriptor.hasOwnProperty("value")){
            let value = oldDescriptor.value;
            if(typeof value === "function"){
                ldvm.toolsFunc.safeFunc(value, prop);
            }
            newDescriptor.value = value;
        }
        if(oldDescriptor.hasOwnProperty("get")){
            let get = oldDescriptor.get;
            if(typeof get === "function"){
                ldvm.toolsFunc.safeFunc(get, `get ${prop}`);
            }
            newDescriptor.get = get;
        }
        if(oldDescriptor.hasOwnProperty("set")){
            let set = oldDescriptor.set;
            if(typeof set === "function"){
                ldvm.toolsFunc.safeFunc(set, `set ${prop}`);
            }
            newDescriptor.set = set;
        }
        Object.defineProperty(obj, prop, newDescriptor)
    }
    
    
    //函数native化
    !function (){
        const $toString = Function.prototype.toString;
        const symbol = Symbol(); // 独一无二的属性

        const myToString = function (){
            //调用者是函数---如果调用者有symbol属性则返回，如果调用者没该属性，则返回Function.prototype中的toString
            return typeof this === 'function' && this[symbol] || $toString.call(this);
        }

        function set_native(func, key, value){
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
    ldvm.toolsFunc.reNameObj = function(obj, name){
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

    //base64
    // 编码函数：字符串 -> Base64
    ldvm.toolsFunc.base64 = {}
    ldvm.toolsFunc.base64.base64encode = function base64encode(str) {
        // 先把字符串转成 UTF-8 编码的字节
        const utf8Bytes = unescape(encodeURIComponent(str));
        let base64 = '';
        const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/';
        const pad = '=';

        for (let i = 0; i < utf8Bytes.length; i += 3) {
            const a = utf8Bytes.charCodeAt(i);
            const b = utf8Bytes.charCodeAt(i + 1);
            const c = utf8Bytes.charCodeAt(i + 2);

            const chunk = (a << 16) | ((b || 0) << 8) | (c || 0);

            base64 += chars.charAt((chunk >> 18) & 0x3F);
            base64 += chars.charAt((chunk >> 12) & 0x3F);
            base64 += chars.charAt((chunk >> 6) & 0x3F);
            base64 += chars.charAt(chunk & 0x3F);
        }

        const padLen = 3 - (utf8Bytes.length % 3);
        if (padLen !== 3) {
            base64 = base64.slice(0, base64.length - padLen) + pad.repeat(padLen);
        }

        return base64;
    };

    // 解码函数：Base64 -> 原字符串
    ldvm.toolsFunc.base64.base64decode = function base64decode(str) {
        const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/';
        const pad = '=';
        str = str.replace(/\s/g, ''); // 去掉空格换行

        let bytes = [];
        for (let i = 0; i < str.length; i += 4) {
            const a = chars.indexOf(str[i]);
            const b = chars.indexOf(str[i + 1]);
            const c = chars.indexOf(str[i + 2]);
            const d = chars.indexOf(str[i + 3]);

            const chunk = (a << 18) | (b << 12) | ((c !== -1 ? c : 0) << 6) | (d !== -1 ? d : 0);

            bytes.push((chunk >> 16) & 0xFF);
            if (str[i + 2] !== pad) bytes.push((chunk >> 8) & 0xFF);
            if (str[i + 3] !== pad) bytes.push(chunk & 0xFF);
        }

        // 转成 UTF-8 字符串
        return decodeURIComponent(escape(String.fromCharCode(...bytes)));
    };
}()
//浏览器接口实现
!function () {
    ldvm.envFunc.EventTarget_addEventListener = function EventTarget_addEventListener() {
        let type = arguments[0];
        let listener = arguments[1];
        let options = arguments[2];
        console.log(`${this}添加了${type}事件监听`);
        let event = {
            "self": this,
            "type": type,
            "listener": listener,
            "options": options
        }
        // if(ldvm.memory.asyncEvent.listener === undefined) {
        //     ldvm.memory.asyncEvent.listener = {};
        // }
        if(ldvm.memory.asyncEvent.listener[type] === undefined) {
            ldvm.memory.asyncEvent.listener[type] = [];
        }
        ldvm.memory.asyncEvent.listener[type].push(event);
    }
    ldvm.envFunc.HTMLElement_offsetHeight_get = function HTMLElement_offsetHeight_get() {
        //先拿到字体---是否可以识别
        let fontFamily = this.style.fontFamily;
        if (ldvm.memory.globalVar.fontList.indexOf(fontFamily) !== -1) {
            //可以识别
            return 666;
        } else {//不可识别
            return 999;
        }
    }

    ldvm.envFunc.HTMLElement_offsetWidth_get = function HTMLElement_offsetWidth_get() {
        let fontFamily = this.style.fontFamily;
        if (ldvm.memory.globalVar.fontList.indexOf(fontFamily) !== -1) {
            return 1666;
        } else {
            return 1999;
        }
    }

    ldvm.envFunc.Element_children_get = function Element_children_get() {
        return ldvm.toolsFunc.getProtoArr.call(this, "children");
    }
    ldvm.envFunc.Node_appendChild = function Node_appendChild() {
        let tag = arguments[0];
        let collection = [];
        collection.push(tag);

        ldvm.toolsFunc.createProxyObj(collection, HTMLCollection, "collection");
        //添加是可能对很多属性有改变，但是暂时先对应上一个
        ldvm.toolsFunc.setProtoArr.call(this, "children", collection);
    }
    ldvm.envFunc.Document_body_get = function Document_body_get() {
        let collection = ldvm.toolsFunc.getCollection('[object HTMLBodyElement]');
        return collection[0]
    }

    ldvm.envFunc.Element_innerHTML_set = function Element_innerHTML_set() {
        let htmlStr = arguments[0];
        //设置字体属性的位置
        let style = {
            "font-family": "mmll",
            "font-size": "160px",
            "fontFamily": "mmll"
        }
        //具体情况自己实现
        //例子<span lang="zh" style="font-family:mmll;font-size:160px">fontTest</span>
        let tagJson = {
            "type": "span",
            "prop": {
                "lang": "zh",
                "style": style,
                "textContent": "fontTest"
            }
        }
        let span = document.createElement(tagJson["type"]);
        for (const key in tagJson["prop"]) {
            ldvm.toolsFunc.setProtoArr.call(span, key, tagJson["prop"][key]);
        }
    }

    ldvm.envFunc.WebGLRenderingContext_canvas_get = function WebGLRenderingContext_canvas_get() {
        return ldvm.toolsFunc.getProtoArr.call(this, "canvas");
    }
    ldvm.envFunc.WebGLRenderingContext_createProgram = function WebGLRenderingContext_createProgram() {
        let program = {};
        program = ldvm.toolsFunc.createProxyObj(program, WebGLProgram, "program");
        return program;
    }
    ldvm.envFunc.WebGLRenderingContext_createBuffer = function WebGLRenderingContext_createBuffer() {
        let buffer = {}
        buffer = ldvm.toolsFunc.createProxyObj(buffer, WebGLBuffer, "buffer")
    }

    ldvm.envFunc.HTMLCanvasElement_toDataURL = function HTMLCanvasElement_toDataURL() {
        let type = ldvm.toolsFunc.getProtoArr.call(this, "type", type)
        if (type === "2d") {
            return ldvm.memory.globalVar.canvas_2d;
        } else if (type === "webgl") {
            return ldvm.memory.globalVar.canvas_webgl
        }


    }
    ldvm.envFunc.HTMLCanvasElement_getContext = function HTMLCanvasElement_getContext() {
        let type = arguments[0];
        let context = {};
        switch (type) {
            case "2d":
                context = ldvm.toolsFunc.createProxyObj(context, CanvasRenderingContext2D, "context_2d");
                ldvm.toolsFunc.createProxyObj(context, "canvas", this)
                ldvm.toolsFunc.setProtoArr.call(this, "type", type)
                break;
            case "webgl":
                context = ldvm.toolsFunc.createProxyObj(context, WebGLRenderingContext, "context_webgl");
                ldvm.toolsFunc.createProxyObj(context, "canvas", this)
                ldvm.toolsFunc.setProtoArr.call(this, "type", type)

                break;

            default:
                console.log(`HTMLCanvasElement_getContext_${type}未实现`);
                break;
        }
        return context;
    }
    ldvm.envFunc.HTMLElement_style_get = function HTMLElement_style_get() {
        let style = {};
        style = ldvm.toolsFunc.createProxyObj(style, CSSStyleDeclaration, "")
    }
    ldvm.envFunc.HTMLCanvasElement_width_set = function HTMLCanvasElement_width_set() {
    }

    ldvm.envFunc.HTMLCanvasElement_height_set = function HTMLCanvasElement_height_set() {
    }
    ldvm.envFunc.Plugin_namedItem = function Plugin_namedItem() {
        let name = arguments[0];
        return this[name];
    }

    ldvm.envFunc.Plugin_item = function Plugin_item() {
        let index = arguments[0];
        return this[index];
    }
    ldvm.envFunc.MimeTypeArray_namedItem = function MimeTypeArray_namedItem() {
        let name = arguments[0];
        return this[name];
    }

    ldvm.envFunc.MimeTypeArray_item = function MimeTypeArray_item() {
        let index = arguments[0];
        return this[index];
    }

    ldvm.envFunc.PluginArray_namedItem = function PluginArray_namedItem() {
        let name = arguments[0];
        return this[name];
    }

    ldvm.envFunc.PluginArray_item = function PluginArray_item() {
        let index = arguments[0];
        return this[index];
    }

    ldvm.envFunc.Plugin_description_get = function Plugin_description_get() {
        return ldvm.toolsFunc.getProtoArr.call(this, "description");
    }

    ldvm.envFunc.Plugin_filename_get = function Plugin_filename_get() {
        return ldvm.toolsFunc.getProtoArr.call(this, "filename");
    }

    ldvm.envFunc.Plugin_length_get = function Plugin_length_get() {
        return ldvm.toolsFunc.getProtoArr.call(this, "length");
    }

    ldvm.envFunc.MimeType_suffixes_get = function MimeType_suffixes_get() {
        return ldvm.toolsFunc.getProtoArr.call(this, "suffixes");
    }

    ldvm.envFunc.MimeType_enabledPlugin_get = function MimeType_enabledPlugin_get() {
        return ldvm.toolsFunc.getProtoArr.call(this, "enabledPlugin");
    }
    ldvm.envFunc.MimeTypeArray_length_get = function MimeTypeArray_length_get() {
        return ldvm.toolsFunc.getProtoArr.call(this, "length");
    }

    ldvm.envFunc.MimeType_type_get = function MimeType_type_get() {
        return ldvm.toolsFunc.getProtoArr.call(this, "type");
    }

    ldvm.envFunc.PluginArray_length_get = function PluginArray_length_get() {
        return ldvm.toolsFunc.getProtoArr.call(this, "length");
    }

    ldvm.envFunc.Plugin_name_get = function Plugin_name_get() {
        return ldvm.toolsFunc.getProtoArr.call(this, "name");
    }
    ldvm.envFunc.Navigator_mimeTypes_get = function Navigator_mimeTypes_get() {
        return ldvm.memory.globalVar.mimeTypeArray;
    }

    ldvm.envFunc.Navigator_plugins_get = function Navigator_plugins_get() {
        return ldvm.memory.globalVar.pluginArray
    }

    ldvm.envFunc.HTMLInputElement_value_get = function HTMLInputElement_value_get() {
        return ldvm.toolsFunc.getProtoArr.call(this, "value");
    }

    ldvm.envFunc.HTMLInputElement_value_set = function HTMLInputElement_value_set() {
        let value = arguments[0];
        ldvm.toolsFunc.setProtoArr.call(this, "value", value);
    }
    ldvm.envFunc.HTMLInputElement_name_get = function HTMLInputElement_name_get() {
        return ldvm.toolsFunc.getProtoArr.call(this, "name");
    }

    ldvm.envFunc.HTMLInputElement_name_set = function HTMLInputElement_name_set() {
        let value = arguments[0];
        ldvm.toolsFunc.setProtoArr.call(this, "name", value);
    }
    ldvm.envFunc.Element_id_get = function Element_id_get() {
        return ldvm.toolsFunc.getProtoArr.call(this, "id");
    }
    ldvm.envFunc.Element_id_set = function Element_id_set() {
        let id = arguments[0]
        ldvm.toolsFunc.setProtoArr.call(this, "id", id);
    }
    ldvm.envFunc.HTMLInputElement_type_set = function HTMLInputElement_type_set() {
        let value = arguments[0];
        ldvm.toolsFunc.setProtoArr.call(this, "type", value)
    }
    ldvm.envFunc.HTMLInputElement_type_get = function HTMLInputElement_type_get() {
        return ldvm.toolsFunc.getProtoArr.call(this, "type");
    }


    ldvm.envFunc.Node_removeChild = function Node_removeChild() {
    }


    ldvm.envFunc.Node_parentNode_get = function Node_parentNode_get() {
        return ldvm.toolsFunc.getProtoArr.call(this, "parentNode");
    }


    ldvm.envFunc.HTMLMetaElement_content_get = function HTMLMetaElement_content_get() {
        return ldvm.toolsFunc.getProtoArr.call(this, "content");
    }
    ldvm.envFunc.HTMLMetaElement_content_set = function HTMLMetaElement_content_set() {
        let value = arguments[0];
        return ldvm.toolsFunc.setProtoArr.call(this, "content", value);
    }


    ldvm.envFunc.HTMLDivElement_align_get = function HTMLDivElement_align_get() {
        return ldvm.toolsFunc.getProtoArr.call(this, "align");
    }
    ldvm.envFunc.HTMLDivElement_align_set = function HTMLDivElement_align_set() {
        let value = arguments[0];
        return ldvm.toolsFunc.setProtoArr.call(this, "align", value);
    }
    //只实现了div、meta、canvas、head、input、canvas、a
    ldvm.envFunc.Document_createElement = function Document_createElement() {
        let tagName = arguments[0].toLowerCase();
        let options = arguments[1];
        let tag = {};
        switch (tagName) {
            case "div":
                //设置实例对象的原型与代理    
                tag = ldvm.toolsFunc.createProxyObj(tag, HTMLDivElement, `${tagName}`);
                ldvm.memory.tag.push(tag);
                break;
            case "meta":
                tag = ldvm.toolsFunc.createProxyObj(tag, HTMLMetaElement, `${tagName}`);
                ldvm.memory.tag.push(tag);
                break
            case "head":
                tag = ldvm.toolsFunc.createProxyObj(tag, HTMLHeadElement, `${tagName}`);
                ldvm.memory.tag.push(tag);
                break
            case "input":
                tag = ldvm.toolsFunc.createProxyObj(tag, HTMLInputElement, `${tagName}`);
                ldvm.memory.tag.push(tag);
                break
            case "a":
                tag = ldvm.toolsFunc.createProxyObj(tag, HTMLAnchorElement, `${tagName}`);
                ldvm.memory.tag.push(tag)
            case "canvas":
                tag = ldvm.toolsFunc.createProxyObj(tag, HTMLCanvasElement, `${tagName}`)
                ldvm.memory.tag.push(tag)
            case "body":
                tag = ldvm.toolsFunc.createProxyObj(tag, HTMLBodyElement, `${tagName}`)
                ldvm.memory.tag.push(tag)
            case "span":
                tag = ldvm.toolsFunc.createProxyObj(tag, HTMLSpanElement, `${tagName}`)
                ldvm.memory.tag.push(tag)







            default:
                console.log(`Document_createElement_${tagName}未实现`);
                break;
        }
        return tag;
    }
    //只实现了meta
    ldvm.envFunc.Document_getElementsByTagName = function Document_getElementsByTagName() {
        let tagName = arguments[0].toLowerCase();
        let collection = []
        switch (tagName) {
            case "meta":
                collection = ldvm.toolsFunc.getCollection('[object HTMLMetaElement]');
                collection = ldvm.toolsFunc.createProxyObj(collection, HTMLCollection, `Document_getElementsByTagName_${tagName}`)
                break;
            default:
                console.log(`Document_getElementsByTagName_${tagName}未实现`);
                break;
        }
        return collection
    }
    ldvm.envFunc.Document_write = function Document_write() {
        let tagStr = arguments[0];
        let tagJson = ldvm.toolsFunc.getTagJson(tagStr)
        let tag = document.createElement(tagJson.type);
        for (const key in tagJson.prop) {
            //如果没有设置进去我们自己的API--setProtoArr设置
            tag[key] = tagJson.prop[key];
            if (tag[key] === undefined) {
                ldvm.toolsFunc.setProtoArr.call(tag, key, tagJson.prop[key]);
            }
        }
    };
    //返回同类标签中对应ID的标签
    ldvm.envFunc.Document_getElementById = function Document_getElementById() {
        let id = arguments[0];
        let tags = ldvm.memory.tag;
        for (let i = 0; i < tags.length; i++) {
            if (tags[i].id === id) {
                return tags[i];
            }
        }
        return null;
    };
    ldvm.envFunc.Document_cookie_get = function Document_cookie_get() {
        let jsonCookie = ldvm.memory.globalVar.jsonCookie;
        let tempCookie = ""
        for (const key in jsonCookie) {
            if (key === "") {
                tempCookie += `${jsonCookie[key]}; `

            }
            else {
                tempCookie += `${key}=${jsonCookie[key]}; `

            }
        }
        return tempCookie
    }
    ldvm.envFunc.Document_cookie_set = function Document_cookie_set() {
        let cookieValue = arguments[0];
        let index = cookieValue.indexOf(";");
        if (index !== -1) {
            cookieValue = cookieValue.substring(0, index)
        }
        if (cookieValue.indexOf("=") === -1) {
            ldvm.memory.globalVar.jsonCookie[""] = cookieValue.trim();
        } else {
            let item = cookieValue.split("=");
            let k = item[0];
            let v = item[1];
            ldvm.memory.globalVar.jsonCookie[k] = v;
        }
    }
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
    ldvm.envFunc.Storage_getItem = function Storage_getItem() {
        let keyname = arguments[0]
        let valuename = arguments[1]
        if (keyname in Storage) {
            return this[keyname]
        }
        return null
    }
    ldvm.envFunc.Storage_setItem = function Storage_setItem() {
        let keyname = arguments[0]
        let valuename = arguments[1]
        this[keyname] = valuename
        return null
    }
    ldvm.envFunc.Storage_key = function Storage_key() {
        let index = arguments[0];
        let i = 0;
        for (const key in this) {
            if (i === index) {
                return key;
            }
            i++;
        }
        return null
    }
    ldvm.envFunc.Storage_clear = function Storage_clear() {
        for (const key in this) {
            delete this[key];
        }
    }
    ldvm.envFunc.Storage_length_get = function Storage_length_get() {
        let i = 0;
        for (const key in Object.getOwnPropertyDescriptors(this)) {
            i++;
        }
        return i;
    }
    ldvm.envFunc.removeItem = function removeItem() {
        let keyname = arguments[0]
        delete this[keyname]
        return null

    }
}()

//env相关代码

// EventTarget对象
EventTarget = function EventTarget(){}
ldvm.toolsFunc.safeProto(EventTarget, "EventTarget");
Object.setPrototypeOf(EventTarget.prototype, Object.prototype);
ldvm.toolsFunc.defineProperty(EventTarget.prototype, "addEventListener", {configurable:true, enumerable:true, writable:true, value: function (){return ldvm.toolsFunc.dispatch(this, EventTarget.prototype, "EventTarget", "addEventListener", arguments)}});
ldvm.toolsFunc.defineProperty(EventTarget.prototype, "dispatchEvent", {configurable:true, enumerable:true, writable:true, value: function (){return ldvm.toolsFunc.dispatch(this, EventTarget.prototype, "EventTarget", "dispatchEvent", arguments)}});
ldvm.toolsFunc.defineProperty(EventTarget.prototype, "removeEventListener", {configurable:true, enumerable:true, writable:true, value: function (){return ldvm.toolsFunc.dispatch(this, EventTarget.prototype, "EventTarget", "removeEventListener", arguments)}});
ldvm.toolsFunc.defineProperty(EventTarget.prototype, "when", {configurable:true, enumerable:true, writable:true, value: function (){return ldvm.toolsFunc.dispatch(this, EventTarget.prototype, "EventTarget", "when", arguments)}});



WindowProperties = function WindowProperties(){}

//保护原型
// //native化-补Window.toString()
// ldvm.toolsFunc.setNative(WindowProperties, "WindowProperties")
// //补window.toString()--这是Window.prototype上的Symbol.toStringTag
// ldvm.toolsFunc.reNameObj(WindowProperties, "WindowProperties")
ldvm.toolsFunc.safeProto(WindowProperties, "WindowProperties")

//设置window原型 ,把window的原型设置为Window(大写)
Object.setPrototypeOf(WindowProperties.prototype, EventTarget.prototype)
Window = function Window(){
    //模拟浏览器new Window()报错--
    ldvm.toolsFunc.throwError("TypeError", "Illegal constructor")
}

// //native化-补Window.toString()
// ldvm.toolsFunc.setNative(Window, "Window")

// //补window.toString()--这是Window.prototype上的Symbol.toStringTag
// ldvm.toolsFunc.reNameObj(Window, "Window")

//保护Window原型
ldvm.toolsFunc.safeProto(Window, "Window")

Object.setPrototypeOf(Window.prototype, WindowProperties.prototype)


//浏览器访问不到WindowProperties,但是window补环境需要，所有补完原型链后删除




// Node对象
Node = function Node(){ldvm.toolsFunc.throwError("TypeError", "Failed to construct 'Node': Illegal constructor")}
ldvm.toolsFunc.safeProto(Node, "Node");
Object.setPrototypeOf(Node.prototype, EventTarget.prototype);
ldvm.toolsFunc.defineProperty(Node, "ELEMENT_NODE", {configurable:false, enumerable:true, writable:false, value:1});
ldvm.toolsFunc.defineProperty(Node, "ATTRIBUTE_NODE", {configurable:false, enumerable:true, writable:false, value:2});
ldvm.toolsFunc.defineProperty(Node, "TEXT_NODE", {configurable:false, enumerable:true, writable:false, value:3});
ldvm.toolsFunc.defineProperty(Node, "CDATA_SECTION_NODE", {configurable:false, enumerable:true, writable:false, value:4});
ldvm.toolsFunc.defineProperty(Node, "ENTITY_REFERENCE_NODE", {configurable:false, enumerable:true, writable:false, value:5});
ldvm.toolsFunc.defineProperty(Node, "ENTITY_NODE", {configurable:false, enumerable:true, writable:false, value:6});
ldvm.toolsFunc.defineProperty(Node, "PROCESSING_INSTRUCTION_NODE", {configurable:false, enumerable:true, writable:false, value:7});
ldvm.toolsFunc.defineProperty(Node, "COMMENT_NODE", {configurable:false, enumerable:true, writable:false, value:8});
ldvm.toolsFunc.defineProperty(Node, "DOCUMENT_NODE", {configurable:false, enumerable:true, writable:false, value:9});
ldvm.toolsFunc.defineProperty(Node, "DOCUMENT_TYPE_NODE", {configurable:false, enumerable:true, writable:false, value:10});
ldvm.toolsFunc.defineProperty(Node, "DOCUMENT_FRAGMENT_NODE", {configurable:false, enumerable:true, writable:false, value:11});
ldvm.toolsFunc.defineProperty(Node, "NOTATION_NODE", {configurable:false, enumerable:true, writable:false, value:12});
ldvm.toolsFunc.defineProperty(Node, "DOCUMENT_POSITION_DISCONNECTED", {configurable:false, enumerable:true, writable:false, value:1});
ldvm.toolsFunc.defineProperty(Node, "DOCUMENT_POSITION_PRECEDING", {configurable:false, enumerable:true, writable:false, value:2});
ldvm.toolsFunc.defineProperty(Node, "DOCUMENT_POSITION_FOLLOWING", {configurable:false, enumerable:true, writable:false, value:4});
ldvm.toolsFunc.defineProperty(Node, "DOCUMENT_POSITION_CONTAINS", {configurable:false, enumerable:true, writable:false, value:8});
ldvm.toolsFunc.defineProperty(Node, "DOCUMENT_POSITION_CONTAINED_BY", {configurable:false, enumerable:true, writable:false, value:16});
ldvm.toolsFunc.defineProperty(Node, "DOCUMENT_POSITION_IMPLEMENTATION_SPECIFIC", {configurable:false, enumerable:true, writable:false, value:32});
ldvm.toolsFunc.defineProperty(Node.prototype, "nodeType", {configurable:true, enumerable:true, get: function (){return ldvm.toolsFunc.dispatch(this, Node.prototype, "Node", "nodeType_get", arguments)},set:undefined});
ldvm.toolsFunc.defineProperty(Node.prototype, "nodeName", {configurable:true, enumerable:true, get: function (){return ldvm.toolsFunc.dispatch(this, Node.prototype, "Node", "nodeName_get", arguments)},set:undefined});
ldvm.toolsFunc.defineProperty(Node.prototype, "baseURI", {configurable:true, enumerable:true, get: function (){return ldvm.toolsFunc.dispatch(this, Node.prototype, "Node", "baseURI_get", arguments)},set:undefined});
ldvm.toolsFunc.defineProperty(Node.prototype, "isConnected", {configurable:true, enumerable:true, get: function (){return ldvm.toolsFunc.dispatch(this, Node.prototype, "Node", "isConnected_get", arguments)},set:undefined});
ldvm.toolsFunc.defineProperty(Node.prototype, "ownerDocument", {configurable:true, enumerable:true, get: function (){return ldvm.toolsFunc.dispatch(this, Node.prototype, "Node", "ownerDocument_get", arguments)},set:undefined});
ldvm.toolsFunc.defineProperty(Node.prototype, "parentNode", {configurable:true, enumerable:true, get: function (){return ldvm.toolsFunc.dispatch(this, Node.prototype, "Node", "parentNode_get", arguments)},set:undefined});
ldvm.toolsFunc.defineProperty(Node.prototype, "parentElement", {configurable:true, enumerable:true, get: function (){return ldvm.toolsFunc.dispatch(this, Node.prototype, "Node", "parentElement_get", arguments)},set:undefined});
ldvm.toolsFunc.defineProperty(Node.prototype, "childNodes", {configurable:true, enumerable:true, get: function (){return ldvm.toolsFunc.dispatch(this, Node.prototype, "Node", "childNodes_get", arguments)},set:undefined});
ldvm.toolsFunc.defineProperty(Node.prototype, "firstChild", {configurable:true, enumerable:true, get: function (){return ldvm.toolsFunc.dispatch(this, Node.prototype, "Node", "firstChild_get", arguments)},set:undefined});
ldvm.toolsFunc.defineProperty(Node.prototype, "lastChild", {configurable:true, enumerable:true, get: function (){return ldvm.toolsFunc.dispatch(this, Node.prototype, "Node", "lastChild_get", arguments)},set:undefined});
ldvm.toolsFunc.defineProperty(Node.prototype, "previousSibling", {configurable:true, enumerable:true, get: function (){return ldvm.toolsFunc.dispatch(this, Node.prototype, "Node", "previousSibling_get", arguments)},set:undefined});
ldvm.toolsFunc.defineProperty(Node.prototype, "nextSibling", {configurable:true, enumerable:true, get: function (){return ldvm.toolsFunc.dispatch(this, Node.prototype, "Node", "nextSibling_get", arguments)},set:undefined});
ldvm.toolsFunc.defineProperty(Node.prototype, "nodeValue", {configurable:true, enumerable:true, get: function (){return ldvm.toolsFunc.dispatch(this, Node.prototype, "Node", "nodeValue_get", arguments)},set: function (){return ldvm.toolsFunc.dispatch(this, Node.prototype, "Node", "nodeValue_set", arguments)}});
ldvm.toolsFunc.defineProperty(Node.prototype, "textContent", {configurable:true, enumerable:true, get: function (){return ldvm.toolsFunc.dispatch(this, Node.prototype, "Node", "textContent_get", arguments)},set: function (){return ldvm.toolsFunc.dispatch(this, Node.prototype, "Node", "textContent_set", arguments)}});
ldvm.toolsFunc.defineProperty(Node.prototype, "ELEMENT_NODE", {configurable:false, enumerable:true, writable:false, value:1});
ldvm.toolsFunc.defineProperty(Node.prototype, "ATTRIBUTE_NODE", {configurable:false, enumerable:true, writable:false, value:2});
ldvm.toolsFunc.defineProperty(Node.prototype, "TEXT_NODE", {configurable:false, enumerable:true, writable:false, value:3});
ldvm.toolsFunc.defineProperty(Node.prototype, "CDATA_SECTION_NODE", {configurable:false, enumerable:true, writable:false, value:4});
ldvm.toolsFunc.defineProperty(Node.prototype, "ENTITY_REFERENCE_NODE", {configurable:false, enumerable:true, writable:false, value:5});
ldvm.toolsFunc.defineProperty(Node.prototype, "ENTITY_NODE", {configurable:false, enumerable:true, writable:false, value:6});
ldvm.toolsFunc.defineProperty(Node.prototype, "PROCESSING_INSTRUCTION_NODE", {configurable:false, enumerable:true, writable:false, value:7});
ldvm.toolsFunc.defineProperty(Node.prototype, "COMMENT_NODE", {configurable:false, enumerable:true, writable:false, value:8});
ldvm.toolsFunc.defineProperty(Node.prototype, "DOCUMENT_NODE", {configurable:false, enumerable:true, writable:false, value:9});
ldvm.toolsFunc.defineProperty(Node.prototype, "DOCUMENT_TYPE_NODE", {configurable:false, enumerable:true, writable:false, value:10});
ldvm.toolsFunc.defineProperty(Node.prototype, "DOCUMENT_FRAGMENT_NODE", {configurable:false, enumerable:true, writable:false, value:11});
ldvm.toolsFunc.defineProperty(Node.prototype, "NOTATION_NODE", {configurable:false, enumerable:true, writable:false, value:12});
ldvm.toolsFunc.defineProperty(Node.prototype, "DOCUMENT_POSITION_DISCONNECTED", {configurable:false, enumerable:true, writable:false, value:1});
ldvm.toolsFunc.defineProperty(Node.prototype, "DOCUMENT_POSITION_PRECEDING", {configurable:false, enumerable:true, writable:false, value:2});
ldvm.toolsFunc.defineProperty(Node.prototype, "DOCUMENT_POSITION_FOLLOWING", {configurable:false, enumerable:true, writable:false, value:4});
ldvm.toolsFunc.defineProperty(Node.prototype, "DOCUMENT_POSITION_CONTAINS", {configurable:false, enumerable:true, writable:false, value:8});
ldvm.toolsFunc.defineProperty(Node.prototype, "DOCUMENT_POSITION_CONTAINED_BY", {configurable:false, enumerable:true, writable:false, value:16});
ldvm.toolsFunc.defineProperty(Node.prototype, "DOCUMENT_POSITION_IMPLEMENTATION_SPECIFIC", {configurable:false, enumerable:true, writable:false, value:32});
ldvm.toolsFunc.defineProperty(Node.prototype, "appendChild", {configurable:true, enumerable:true, writable:true, value: function (){return ldvm.toolsFunc.dispatch(this, Node.prototype, "Node", "appendChild", arguments)}});
ldvm.toolsFunc.defineProperty(Node.prototype, "cloneNode", {configurable:true, enumerable:true, writable:true, value: function (){return ldvm.toolsFunc.dispatch(this, Node.prototype, "Node", "cloneNode", arguments)}});
ldvm.toolsFunc.defineProperty(Node.prototype, "compareDocumentPosition", {configurable:true, enumerable:true, writable:true, value: function (){return ldvm.toolsFunc.dispatch(this, Node.prototype, "Node", "compareDocumentPosition", arguments)}});
ldvm.toolsFunc.defineProperty(Node.prototype, "contains", {configurable:true, enumerable:true, writable:true, value: function (){return ldvm.toolsFunc.dispatch(this, Node.prototype, "Node", "contains", arguments)}});
ldvm.toolsFunc.defineProperty(Node.prototype, "getRootNode", {configurable:true, enumerable:true, writable:true, value: function (){return ldvm.toolsFunc.dispatch(this, Node.prototype, "Node", "getRootNode", arguments)}});
ldvm.toolsFunc.defineProperty(Node.prototype, "hasChildNodes", {configurable:true, enumerable:true, writable:true, value: function (){return ldvm.toolsFunc.dispatch(this, Node.prototype, "Node", "hasChildNodes", arguments)}});
ldvm.toolsFunc.defineProperty(Node.prototype, "insertBefore", {configurable:true, enumerable:true, writable:true, value: function (){return ldvm.toolsFunc.dispatch(this, Node.prototype, "Node", "insertBefore", arguments)}});
ldvm.toolsFunc.defineProperty(Node.prototype, "isDefaultNamespace", {configurable:true, enumerable:true, writable:true, value: function (){return ldvm.toolsFunc.dispatch(this, Node.prototype, "Node", "isDefaultNamespace", arguments)}});
ldvm.toolsFunc.defineProperty(Node.prototype, "isEqualNode", {configurable:true, enumerable:true, writable:true, value: function (){return ldvm.toolsFunc.dispatch(this, Node.prototype, "Node", "isEqualNode", arguments)}});
ldvm.toolsFunc.defineProperty(Node.prototype, "isSameNode", {configurable:true, enumerable:true, writable:true, value: function (){return ldvm.toolsFunc.dispatch(this, Node.prototype, "Node", "isSameNode", arguments)}});
ldvm.toolsFunc.defineProperty(Node.prototype, "lookupNamespaceURI", {configurable:true, enumerable:true, writable:true, value: function (){return ldvm.toolsFunc.dispatch(this, Node.prototype, "Node", "lookupNamespaceURI", arguments)}});
ldvm.toolsFunc.defineProperty(Node.prototype, "lookupPrefix", {configurable:true, enumerable:true, writable:true, value: function (){return ldvm.toolsFunc.dispatch(this, Node.prototype, "Node", "lookupPrefix", arguments)}});
ldvm.toolsFunc.defineProperty(Node.prototype, "normalize", {configurable:true, enumerable:true, writable:true, value: function (){return ldvm.toolsFunc.dispatch(this, Node.prototype, "Node", "normalize", arguments)}});
ldvm.toolsFunc.defineProperty(Node.prototype, "removeChild", {configurable:true, enumerable:true, writable:true, value: function (){return ldvm.toolsFunc.dispatch(this, Node.prototype, "Node", "removeChild", arguments)}});
ldvm.toolsFunc.defineProperty(Node.prototype, "replaceChild", {configurable:true, enumerable:true, writable:true, value: function (){return ldvm.toolsFunc.dispatch(this, Node.prototype, "Node", "replaceChild", arguments)}});

// Element对象
const Element = function Element() {
  ldvm.toolsFunc.throwError("TypeError", "Failed to construct 'Element': Illegal constructor");
};
ldvm.toolsFunc.safeProto(Element, "Element");
Object.setPrototypeOf(Element.prototype, Node.prototype);


ldvm.toolsFunc.defineProperty(Element.prototype, "namespaceURI", {configurable:true, enumerable:true, get: function (){return ldvm.toolsFunc.dispatch(this, Element.prototype, "Element", "namespaceURI_get", arguments)},set:undefined});
ldvm.toolsFunc.defineProperty(Element.prototype, "prefix", {configurable:true, enumerable:true, get: function (){return ldvm.toolsFunc.dispatch(this, Element.prototype, "Element", "prefix_get", arguments)},set:undefined});
ldvm.toolsFunc.defineProperty(Element.prototype, "localName", {configurable:true, enumerable:true, get: function (){return ldvm.toolsFunc.dispatch(this, Element.prototype, "Element", "localName_get", arguments)},set:undefined});
ldvm.toolsFunc.defineProperty(Element.prototype, "tagName", {configurable:true, enumerable:true, get: function (){return ldvm.toolsFunc.dispatch(this, Element.prototype, "Element", "tagName_get", arguments)},set:undefined});
ldvm.toolsFunc.defineProperty(Element.prototype, "id", {configurable:true, enumerable:true, get: function (){return ldvm.toolsFunc.dispatch(this, Element.prototype, "Element", "id_get", arguments)},set: function (){return ldvm.toolsFunc.dispatch(this, Element.prototype, "Element", "id_set", arguments)}});
ldvm.toolsFunc.defineProperty(Element.prototype, "className", {configurable:true, enumerable:true, get: function (){return ldvm.toolsFunc.dispatch(this, Element.prototype, "Element", "className_get", arguments)},set: function (){return ldvm.toolsFunc.dispatch(this, Element.prototype, "Element", "className_set", arguments)}});
ldvm.toolsFunc.defineProperty(Element.prototype, "classList", {configurable:true, enumerable:true, get: function (){return ldvm.toolsFunc.dispatch(this, Element.prototype, "Element", "classList_get", arguments)},set: function (){return ldvm.toolsFunc.dispatch(this, Element.prototype, "Element", "classList_set", arguments)}});
ldvm.toolsFunc.defineProperty(Element.prototype, "slot", {configurable:true, enumerable:true, get: function (){return ldvm.toolsFunc.dispatch(this, Element.prototype, "Element", "slot_get", arguments)},set: function (){return ldvm.toolsFunc.dispatch(this, Element.prototype, "Element", "slot_set", arguments)}});
ldvm.toolsFunc.defineProperty(Element.prototype, "attributes", {configurable:true, enumerable:true, get: function (){return ldvm.toolsFunc.dispatch(this, Element.prototype, "Element", "attributes_get", arguments)},set:undefined});
ldvm.toolsFunc.defineProperty(Element.prototype, "shadowRoot", {configurable:true, enumerable:true, get: function (){return ldvm.toolsFunc.dispatch(this, Element.prototype, "Element", "shadowRoot_get", arguments)},set:undefined});
ldvm.toolsFunc.defineProperty(Element.prototype, "part", {configurable:true, enumerable:true, get: function (){return ldvm.toolsFunc.dispatch(this, Element.prototype, "Element", "part_get", arguments)},set: function (){return ldvm.toolsFunc.dispatch(this, Element.prototype, "Element", "part_set", arguments)}});
ldvm.toolsFunc.defineProperty(Element.prototype, "assignedSlot", {configurable:true, enumerable:true, get: function (){return ldvm.toolsFunc.dispatch(this, Element.prototype, "Element", "assignedSlot_get", arguments)},set:undefined});
ldvm.toolsFunc.defineProperty(Element.prototype, "innerHTML", {configurable:true, enumerable:true, get: function (){return ldvm.toolsFunc.dispatch(this, Element.prototype, "Element", "innerHTML_get", arguments)},set: function (){return ldvm.toolsFunc.dispatch(this, Element.prototype, "Element", "innerHTML_set", arguments)}});
ldvm.toolsFunc.defineProperty(Element.prototype, "outerHTML", {configurable:true, enumerable:true, get: function (){return ldvm.toolsFunc.dispatch(this, Element.prototype, "Element", "outerHTML_get", arguments)},set: function (){return ldvm.toolsFunc.dispatch(this, Element.prototype, "Element", "outerHTML_set", arguments)}});
ldvm.toolsFunc.defineProperty(Element.prototype, "scrollTop", {configurable:true, enumerable:true, get: function (){return ldvm.toolsFunc.dispatch(this, Element.prototype, "Element", "scrollTop_get", arguments)},set: function (){return ldvm.toolsFunc.dispatch(this, Element.prototype, "Element", "scrollTop_set", arguments)}});
ldvm.toolsFunc.defineProperty(Element.prototype, "scrollLeft", {configurable:true, enumerable:true, get: function (){return ldvm.toolsFunc.dispatch(this, Element.prototype, "Element", "scrollLeft_get", arguments)},set: function (){return ldvm.toolsFunc.dispatch(this, Element.prototype, "Element", "scrollLeft_set", arguments)}});
ldvm.toolsFunc.defineProperty(Element.prototype, "scrollWidth", {configurable:true, enumerable:true, get: function (){return ldvm.toolsFunc.dispatch(this, Element.prototype, "Element", "scrollWidth_get", arguments)},set:undefined});
ldvm.toolsFunc.defineProperty(Element.prototype, "scrollHeight", {configurable:true, enumerable:true, get: function (){return ldvm.toolsFunc.dispatch(this, Element.prototype, "Element", "scrollHeight_get", arguments)},set:undefined});
ldvm.toolsFunc.defineProperty(Element.prototype, "clientTop", {configurable:true, enumerable:true, get: function (){return ldvm.toolsFunc.dispatch(this, Element.prototype, "Element", "clientTop_get", arguments)},set:undefined});
ldvm.toolsFunc.defineProperty(Element.prototype, "clientLeft", {configurable:true, enumerable:true, get: function (){return ldvm.toolsFunc.dispatch(this, Element.prototype, "Element", "clientLeft_get", arguments)},set:undefined});
ldvm.toolsFunc.defineProperty(Element.prototype, "clientWidth", {configurable:true, enumerable:true, get: function (){return ldvm.toolsFunc.dispatch(this, Element.prototype, "Element", "clientWidth_get", arguments)},set:undefined});
ldvm.toolsFunc.defineProperty(Element.prototype, "clientHeight", {configurable:true, enumerable:true, get: function (){return ldvm.toolsFunc.dispatch(this, Element.prototype, "Element", "clientHeight_get", arguments)},set:undefined});
ldvm.toolsFunc.defineProperty(Element.prototype, "onbeforecopy", {configurable:true, enumerable:true, get: function (){return ldvm.toolsFunc.dispatch(this, Element.prototype, "Element", "onbeforecopy_get", arguments)},set: function (){return ldvm.toolsFunc.dispatch(this, Element.prototype, "Element", "onbeforecopy_set", arguments)}});
ldvm.toolsFunc.defineProperty(Element.prototype, "onbeforecut", {configurable:true, enumerable:true, get: function (){return ldvm.toolsFunc.dispatch(this, Element.prototype, "Element", "onbeforecut_get", arguments)},set: function (){return ldvm.toolsFunc.dispatch(this, Element.prototype, "Element", "onbeforecut_set", arguments)}});
ldvm.toolsFunc.defineProperty(Element.prototype, "onbeforepaste", {configurable:true, enumerable:true, get: function (){return ldvm.toolsFunc.dispatch(this, Element.prototype, "Element", "onbeforepaste_get", arguments)},set: function (){return ldvm.toolsFunc.dispatch(this, Element.prototype, "Element", "onbeforepaste_set", arguments)}});
ldvm.toolsFunc.defineProperty(Element.prototype, "onsearch", {configurable:true, enumerable:true, get: function (){return ldvm.toolsFunc.dispatch(this, Element.prototype, "Element", "onsearch_get", arguments)},set: function (){return ldvm.toolsFunc.dispatch(this, Element.prototype, "Element", "onsearch_set", arguments)}});
ldvm.toolsFunc.defineProperty(Element.prototype, "elementTiming", {configurable:true, enumerable:true, get: function (){return ldvm.toolsFunc.dispatch(this, Element.prototype, "Element", "elementTiming_get", arguments)},set: function (){return ldvm.toolsFunc.dispatch(this, Element.prototype, "Element", "elementTiming_set", arguments)}});
ldvm.toolsFunc.defineProperty(Element.prototype, "onfullscreenchange", {configurable:true, enumerable:true, get: function (){return ldvm.toolsFunc.dispatch(this, Element.prototype, "Element", "onfullscreenchange_get", arguments)},set: function (){return ldvm.toolsFunc.dispatch(this, Element.prototype, "Element", "onfullscreenchange_set", arguments)}});
ldvm.toolsFunc.defineProperty(Element.prototype, "onfullscreenerror", {configurable:true, enumerable:true, get: function (){return ldvm.toolsFunc.dispatch(this, Element.prototype, "Element", "onfullscreenerror_get", arguments)},set: function (){return ldvm.toolsFunc.dispatch(this, Element.prototype, "Element", "onfullscreenerror_set", arguments)}});
ldvm.toolsFunc.defineProperty(Element.prototype, "onwebkitfullscreenchange", {configurable:true, enumerable:true, get: function (){return ldvm.toolsFunc.dispatch(this, Element.prototype, "Element", "onwebkitfullscreenchange_get", arguments)},set: function (){return ldvm.toolsFunc.dispatch(this, Element.prototype, "Element", "onwebkitfullscreenchange_set", arguments)}});
ldvm.toolsFunc.defineProperty(Element.prototype, "onwebkitfullscreenerror", {configurable:true, enumerable:true, get: function (){return ldvm.toolsFunc.dispatch(this, Element.prototype, "Element", "onwebkitfullscreenerror_get", arguments)},set: function (){return ldvm.toolsFunc.dispatch(this, Element.prototype, "Element", "onwebkitfullscreenerror_set", arguments)}});
ldvm.toolsFunc.defineProperty(Element.prototype, "role", {configurable:true, enumerable:true, get: function (){return ldvm.toolsFunc.dispatch(this, Element.prototype, "Element", "role_get", arguments)},set: function (){return ldvm.toolsFunc.dispatch(this, Element.prototype, "Element", "role_set", arguments)}});
ldvm.toolsFunc.defineProperty(Element.prototype, "ariaAtomic", {configurable:true, enumerable:true, get: function (){return ldvm.toolsFunc.dispatch(this, Element.prototype, "Element", "ariaAtomic_get", arguments)},set: function (){return ldvm.toolsFunc.dispatch(this, Element.prototype, "Element", "ariaAtomic_set", arguments)}});
ldvm.toolsFunc.defineProperty(Element.prototype, "ariaAutoComplete", {configurable:true, enumerable:true, get: function (){return ldvm.toolsFunc.dispatch(this, Element.prototype, "Element", "ariaAutoComplete_get", arguments)},set: function (){return ldvm.toolsFunc.dispatch(this, Element.prototype, "Element", "ariaAutoComplete_set", arguments)}});
ldvm.toolsFunc.defineProperty(Element.prototype, "ariaBusy", {configurable:true, enumerable:true, get: function (){return ldvm.toolsFunc.dispatch(this, Element.prototype, "Element", "ariaBusy_get", arguments)},set: function (){return ldvm.toolsFunc.dispatch(this, Element.prototype, "Element", "ariaBusy_set", arguments)}});
ldvm.toolsFunc.defineProperty(Element.prototype, "ariaBrailleLabel", {configurable:true, enumerable:true, get: function (){return ldvm.toolsFunc.dispatch(this, Element.prototype, "Element", "ariaBrailleLabel_get", arguments)},set: function (){return ldvm.toolsFunc.dispatch(this, Element.prototype, "Element", "ariaBrailleLabel_set", arguments)}});
ldvm.toolsFunc.defineProperty(Element.prototype, "ariaBrailleRoleDescription", {configurable:true, enumerable:true, get: function (){return ldvm.toolsFunc.dispatch(this, Element.prototype, "Element", "ariaBrailleRoleDescription_get", arguments)},set: function (){return ldvm.toolsFunc.dispatch(this, Element.prototype, "Element", "ariaBrailleRoleDescription_set", arguments)}});
ldvm.toolsFunc.defineProperty(Element.prototype, "ariaChecked", {configurable:true, enumerable:true, get: function (){return ldvm.toolsFunc.dispatch(this, Element.prototype, "Element", "ariaChecked_get", arguments)},set: function (){return ldvm.toolsFunc.dispatch(this, Element.prototype, "Element", "ariaChecked_set", arguments)}});
ldvm.toolsFunc.defineProperty(Element.prototype, "ariaColCount", {configurable:true, enumerable:true, get: function (){return ldvm.toolsFunc.dispatch(this, Element.prototype, "Element", "ariaColCount_get", arguments)},set: function (){return ldvm.toolsFunc.dispatch(this, Element.prototype, "Element", "ariaColCount_set", arguments)}});
ldvm.toolsFunc.defineProperty(Element.prototype, "ariaColIndex", {configurable:true, enumerable:true, get: function (){return ldvm.toolsFunc.dispatch(this, Element.prototype, "Element", "ariaColIndex_get", arguments)},set: function (){return ldvm.toolsFunc.dispatch(this, Element.prototype, "Element", "ariaColIndex_set", arguments)}});
ldvm.toolsFunc.defineProperty(Element.prototype, "ariaColSpan", {configurable:true, enumerable:true, get: function (){return ldvm.toolsFunc.dispatch(this, Element.prototype, "Element", "ariaColSpan_get", arguments)},set: function (){return ldvm.toolsFunc.dispatch(this, Element.prototype, "Element", "ariaColSpan_set", arguments)}});
ldvm.toolsFunc.defineProperty(Element.prototype, "ariaCurrent", {configurable:true, enumerable:true, get: function (){return ldvm.toolsFunc.dispatch(this, Element.prototype, "Element", "ariaCurrent_get", arguments)},set: function (){return ldvm.toolsFunc.dispatch(this, Element.prototype, "Element", "ariaCurrent_set", arguments)}});
ldvm.toolsFunc.defineProperty(Element.prototype, "ariaDescription", {configurable:true, enumerable:true, get: function (){return ldvm.toolsFunc.dispatch(this, Element.prototype, "Element", "ariaDescription_get", arguments)},set: function (){return ldvm.toolsFunc.dispatch(this, Element.prototype, "Element", "ariaDescription_set", arguments)}});
ldvm.toolsFunc.defineProperty(Element.prototype, "ariaDisabled", {configurable:true, enumerable:true, get: function (){return ldvm.toolsFunc.dispatch(this, Element.prototype, "Element", "ariaDisabled_get", arguments)},set: function (){return ldvm.toolsFunc.dispatch(this, Element.prototype, "Element", "ariaDisabled_set", arguments)}});
ldvm.toolsFunc.defineProperty(Element.prototype, "ariaExpanded", {configurable:true, enumerable:true, get: function (){return ldvm.toolsFunc.dispatch(this, Element.prototype, "Element", "ariaExpanded_get", arguments)},set: function (){return ldvm.toolsFunc.dispatch(this, Element.prototype, "Element", "ariaExpanded_set", arguments)}});
ldvm.toolsFunc.defineProperty(Element.prototype, "ariaHasPopup", {configurable:true, enumerable:true, get: function (){return ldvm.toolsFunc.dispatch(this, Element.prototype, "Element", "ariaHasPopup_get", arguments)},set: function (){return ldvm.toolsFunc.dispatch(this, Element.prototype, "Element", "ariaHasPopup_set", arguments)}});
ldvm.toolsFunc.defineProperty(Element.prototype, "ariaHidden", {configurable:true, enumerable:true, get: function (){return ldvm.toolsFunc.dispatch(this, Element.prototype, "Element", "ariaHidden_get", arguments)},set: function (){return ldvm.toolsFunc.dispatch(this, Element.prototype, "Element", "ariaHidden_set", arguments)}});
ldvm.toolsFunc.defineProperty(Element.prototype, "ariaInvalid", {configurable:true, enumerable:true, get: function (){return ldvm.toolsFunc.dispatch(this, Element.prototype, "Element", "ariaInvalid_get", arguments)},set: function (){return ldvm.toolsFunc.dispatch(this, Element.prototype, "Element", "ariaInvalid_set", arguments)}});
ldvm.toolsFunc.defineProperty(Element.prototype, "ariaKeyShortcuts", {configurable:true, enumerable:true, get: function (){return ldvm.toolsFunc.dispatch(this, Element.prototype, "Element", "ariaKeyShortcuts_get", arguments)},set: function (){return ldvm.toolsFunc.dispatch(this, Element.prototype, "Element", "ariaKeyShortcuts_set", arguments)}});
ldvm.toolsFunc.defineProperty(Element.prototype, "ariaLabel", {configurable:true, enumerable:true, get: function (){return ldvm.toolsFunc.dispatch(this, Element.prototype, "Element", "ariaLabel_get", arguments)},set: function (){return ldvm.toolsFunc.dispatch(this, Element.prototype, "Element", "ariaLabel_set", arguments)}});
ldvm.toolsFunc.defineProperty(Element.prototype, "ariaLevel", {configurable:true, enumerable:true, get: function (){return ldvm.toolsFunc.dispatch(this, Element.prototype, "Element", "ariaLevel_get", arguments)},set: function (){return ldvm.toolsFunc.dispatch(this, Element.prototype, "Element", "ariaLevel_set", arguments)}});
ldvm.toolsFunc.defineProperty(Element.prototype, "ariaLive", {configurable:true, enumerable:true, get: function (){return ldvm.toolsFunc.dispatch(this, Element.prototype, "Element", "ariaLive_get", arguments)},set: function (){return ldvm.toolsFunc.dispatch(this, Element.prototype, "Element", "ariaLive_set", arguments)}});
ldvm.toolsFunc.defineProperty(Element.prototype, "ariaModal", {configurable:true, enumerable:true, get: function (){return ldvm.toolsFunc.dispatch(this, Element.prototype, "Element", "ariaModal_get", arguments)},set: function (){return ldvm.toolsFunc.dispatch(this, Element.prototype, "Element", "ariaModal_set", arguments)}});
ldvm.toolsFunc.defineProperty(Element.prototype, "ariaMultiLine", {configurable:true, enumerable:true, get: function (){return ldvm.toolsFunc.dispatch(this, Element.prototype, "Element", "ariaMultiLine_get", arguments)},set: function (){return ldvm.toolsFunc.dispatch(this, Element.prototype, "Element", "ariaMultiLine_set", arguments)}});
ldvm.toolsFunc.defineProperty(Element.prototype, "ariaMultiSelectable", {configurable:true, enumerable:true, get: function (){return ldvm.toolsFunc.dispatch(this, Element.prototype, "Element", "ariaMultiSelectable_get", arguments)},set: function (){return ldvm.toolsFunc.dispatch(this, Element.prototype, "Element", "ariaMultiSelectable_set", arguments)}});
ldvm.toolsFunc.defineProperty(Element.prototype, "ariaOrientation", {configurable:true, enumerable:true, get: function (){return ldvm.toolsFunc.dispatch(this, Element.prototype, "Element", "ariaOrientation_get", arguments)},set: function (){return ldvm.toolsFunc.dispatch(this, Element.prototype, "Element", "ariaOrientation_set", arguments)}});
ldvm.toolsFunc.defineProperty(Element.prototype, "ariaPlaceholder", {configurable:true, enumerable:true, get: function (){return ldvm.toolsFunc.dispatch(this, Element.prototype, "Element", "ariaPlaceholder_get", arguments)},set: function (){return ldvm.toolsFunc.dispatch(this, Element.prototype, "Element", "ariaPlaceholder_set", arguments)}});
ldvm.toolsFunc.defineProperty(Element.prototype, "ariaPosInSet", {configurable:true, enumerable:true, get: function (){return ldvm.toolsFunc.dispatch(this, Element.prototype, "Element", "ariaPosInSet_get", arguments)},set: function (){return ldvm.toolsFunc.dispatch(this, Element.prototype, "Element", "ariaPosInSet_set", arguments)}});
ldvm.toolsFunc.defineProperty(Element.prototype, "ariaPressed", {configurable:true, enumerable:true, get: function (){return ldvm.toolsFunc.dispatch(this, Element.prototype, "Element", "ariaPressed_get", arguments)},set: function (){return ldvm.toolsFunc.dispatch(this, Element.prototype, "Element", "ariaPressed_set", arguments)}});
ldvm.toolsFunc.defineProperty(Element.prototype, "ariaReadOnly", {configurable:true, enumerable:true, get: function (){return ldvm.toolsFunc.dispatch(this, Element.prototype, "Element", "ariaReadOnly_get", arguments)},set: function (){return ldvm.toolsFunc.dispatch(this, Element.prototype, "Element", "ariaReadOnly_set", arguments)}});
ldvm.toolsFunc.defineProperty(Element.prototype, "ariaRelevant", {configurable:true, enumerable:true, get: function (){return ldvm.toolsFunc.dispatch(this, Element.prototype, "Element", "ariaRelevant_get", arguments)},set: function (){return ldvm.toolsFunc.dispatch(this, Element.prototype, "Element", "ariaRelevant_set", arguments)}});
ldvm.toolsFunc.defineProperty(Element.prototype, "ariaRequired", {configurable:true, enumerable:true, get: function (){return ldvm.toolsFunc.dispatch(this, Element.prototype, "Element", "ariaRequired_get", arguments)},set: function (){return ldvm.toolsFunc.dispatch(this, Element.prototype, "Element", "ariaRequired_set", arguments)}});
ldvm.toolsFunc.defineProperty(Element.prototype, "ariaRoleDescription", {configurable:true, enumerable:true, get: function (){return ldvm.toolsFunc.dispatch(this, Element.prototype, "Element", "ariaRoleDescription_get", arguments)},set: function (){return ldvm.toolsFunc.dispatch(this, Element.prototype, "Element", "ariaRoleDescription_set", arguments)}});
ldvm.toolsFunc.defineProperty(Element.prototype, "ariaRowCount", {configurable:true, enumerable:true, get: function (){return ldvm.toolsFunc.dispatch(this, Element.prototype, "Element", "ariaRowCount_get", arguments)},set: function (){return ldvm.toolsFunc.dispatch(this, Element.prototype, "Element", "ariaRowCount_set", arguments)}});
ldvm.toolsFunc.defineProperty(Element.prototype, "ariaRowIndex", {configurable:true, enumerable:true, get: function (){return ldvm.toolsFunc.dispatch(this, Element.prototype, "Element", "ariaRowIndex_get", arguments)},set: function (){return ldvm.toolsFunc.dispatch(this, Element.prototype, "Element", "ariaRowIndex_set", arguments)}});
ldvm.toolsFunc.defineProperty(Element.prototype, "ariaRowSpan", {configurable:true, enumerable:true, get: function (){return ldvm.toolsFunc.dispatch(this, Element.prototype, "Element", "ariaRowSpan_get", arguments)},set: function (){return ldvm.toolsFunc.dispatch(this, Element.prototype, "Element", "ariaRowSpan_set", arguments)}});
ldvm.toolsFunc.defineProperty(Element.prototype, "ariaSelected", {configurable:true, enumerable:true, get: function (){return ldvm.toolsFunc.dispatch(this, Element.prototype, "Element", "ariaSelected_get", arguments)},set: function (){return ldvm.toolsFunc.dispatch(this, Element.prototype, "Element", "ariaSelected_set", arguments)}});
ldvm.toolsFunc.defineProperty(Element.prototype, "ariaSetSize", {configurable:true, enumerable:true, get: function (){return ldvm.toolsFunc.dispatch(this, Element.prototype, "Element", "ariaSetSize_get", arguments)},set: function (){return ldvm.toolsFunc.dispatch(this, Element.prototype, "Element", "ariaSetSize_set", arguments)}});
ldvm.toolsFunc.defineProperty(Element.prototype, "ariaSort", {configurable:true, enumerable:true, get: function (){return ldvm.toolsFunc.dispatch(this, Element.prototype, "Element", "ariaSort_get", arguments)},set: function (){return ldvm.toolsFunc.dispatch(this, Element.prototype, "Element", "ariaSort_set", arguments)}});
ldvm.toolsFunc.defineProperty(Element.prototype, "ariaValueMax", {configurable:true, enumerable:true, get: function (){return ldvm.toolsFunc.dispatch(this, Element.prototype, "Element", "ariaValueMax_get", arguments)},set: function (){return ldvm.toolsFunc.dispatch(this, Element.prototype, "Element", "ariaValueMax_set", arguments)}});
ldvm.toolsFunc.defineProperty(Element.prototype, "ariaValueMin", {configurable:true, enumerable:true, get: function (){return ldvm.toolsFunc.dispatch(this, Element.prototype, "Element", "ariaValueMin_get", arguments)},set: function (){return ldvm.toolsFunc.dispatch(this, Element.prototype, "Element", "ariaValueMin_set", arguments)}});
ldvm.toolsFunc.defineProperty(Element.prototype, "ariaValueNow", {configurable:true, enumerable:true, get: function (){return ldvm.toolsFunc.dispatch(this, Element.prototype, "Element", "ariaValueNow_get", arguments)},set: function (){return ldvm.toolsFunc.dispatch(this, Element.prototype, "Element", "ariaValueNow_set", arguments)}});
ldvm.toolsFunc.defineProperty(Element.prototype, "ariaValueText", {configurable:true, enumerable:true, get: function (){return ldvm.toolsFunc.dispatch(this, Element.prototype, "Element", "ariaValueText_get", arguments)},set: function (){return ldvm.toolsFunc.dispatch(this, Element.prototype, "Element", "ariaValueText_set", arguments)}});
ldvm.toolsFunc.defineProperty(Element.prototype, "children", {configurable:true, enumerable:true, get: function (){return ldvm.toolsFunc.dispatch(this, Element.prototype, "Element", "children_get", arguments)},set:undefined});
ldvm.toolsFunc.defineProperty(Element.prototype, "firstElementChild", {configurable:true, enumerable:true, get: function (){return ldvm.toolsFunc.dispatch(this, Element.prototype, "Element", "firstElementChild_get", arguments)},set:undefined});
ldvm.toolsFunc.defineProperty(Element.prototype, "lastElementChild", {configurable:true, enumerable:true, get: function (){return ldvm.toolsFunc.dispatch(this, Element.prototype, "Element", "lastElementChild_get", arguments)},set:undefined});
ldvm.toolsFunc.defineProperty(Element.prototype, "childElementCount", {configurable:true, enumerable:true, get: function (){return ldvm.toolsFunc.dispatch(this, Element.prototype, "Element", "childElementCount_get", arguments)},set:undefined});
ldvm.toolsFunc.defineProperty(Element.prototype, "previousElementSibling", {configurable:true, enumerable:true, get: function (){return ldvm.toolsFunc.dispatch(this, Element.prototype, "Element", "previousElementSibling_get", arguments)},set:undefined});
ldvm.toolsFunc.defineProperty(Element.prototype, "nextElementSibling", {configurable:true, enumerable:true, get: function (){return ldvm.toolsFunc.dispatch(this, Element.prototype, "Element", "nextElementSibling_get", arguments)},set:undefined});
ldvm.toolsFunc.defineProperty(Element.prototype, "after", {configurable:true, enumerable:true, writable:true, value: function (){return ldvm.toolsFunc.dispatch(this, Element.prototype, "Element", "after", arguments)}});
ldvm.toolsFunc.defineProperty(Element.prototype, "animate", {configurable:true, enumerable:true, writable:true, value: function (){return ldvm.toolsFunc.dispatch(this, Element.prototype, "Element", "animate", arguments)}});
ldvm.toolsFunc.defineProperty(Element.prototype, "append", {configurable:true, enumerable:true, writable:true, value: function (){return ldvm.toolsFunc.dispatch(this, Element.prototype, "Element", "append", arguments)}});
ldvm.toolsFunc.defineProperty(Element.prototype, "attachShadow", {configurable:true, enumerable:true, writable:true, value: function (){return ldvm.toolsFunc.dispatch(this, Element.prototype, "Element", "attachShadow", arguments)}});
ldvm.toolsFunc.defineProperty(Element.prototype, "before", {configurable:true, enumerable:true, writable:true, value: function (){return ldvm.toolsFunc.dispatch(this, Element.prototype, "Element", "before", arguments)}});
ldvm.toolsFunc.defineProperty(Element.prototype, "checkVisibility", {configurable:true, enumerable:true, writable:true, value: function (){return ldvm.toolsFunc.dispatch(this, Element.prototype, "Element", "checkVisibility", arguments)}});
ldvm.toolsFunc.defineProperty(Element.prototype, "closest", {configurable:true, enumerable:true, writable:true, value: function (){return ldvm.toolsFunc.dispatch(this, Element.prototype, "Element", "closest", arguments)}});
ldvm.toolsFunc.defineProperty(Element.prototype, "computedStyleMap", {configurable:true, enumerable:true, writable:true, value: function (){return ldvm.toolsFunc.dispatch(this, Element.prototype, "Element", "computedStyleMap", arguments)}});
ldvm.toolsFunc.defineProperty(Element.prototype, "getAnimations", {configurable:true, enumerable:true, writable:true, value: function (){return ldvm.toolsFunc.dispatch(this, Element.prototype, "Element", "getAnimations", arguments)}});
ldvm.toolsFunc.defineProperty(Element.prototype, "getAttribute", {configurable:true, enumerable:true, writable:true, value: function (){return ldvm.toolsFunc.dispatch(this, Element.prototype, "Element", "getAttribute", arguments)}});
ldvm.toolsFunc.defineProperty(Element.prototype, "getAttributeNS", {configurable:true, enumerable:true, writable:true, value: function (){return ldvm.toolsFunc.dispatch(this, Element.prototype, "Element", "getAttributeNS", arguments)}});
ldvm.toolsFunc.defineProperty(Element.prototype, "getAttributeNames", {configurable:true, enumerable:true, writable:true, value: function (){return ldvm.toolsFunc.dispatch(this, Element.prototype, "Element", "getAttributeNames", arguments)}});
ldvm.toolsFunc.defineProperty(Element.prototype, "getAttributeNode", {configurable:true, enumerable:true, writable:true, value: function (){return ldvm.toolsFunc.dispatch(this, Element.prototype, "Element", "getAttributeNode", arguments)}});
ldvm.toolsFunc.defineProperty(Element.prototype, "getAttributeNodeNS", {configurable:true, enumerable:true, writable:true, value: function (){return ldvm.toolsFunc.dispatch(this, Element.prototype, "Element", "getAttributeNodeNS", arguments)}});
ldvm.toolsFunc.defineProperty(Element.prototype, "getBoundingClientRect", {configurable:true, enumerable:true, writable:true, value: function (){return ldvm.toolsFunc.dispatch(this, Element.prototype, "Element", "getBoundingClientRect", arguments)}});
ldvm.toolsFunc.defineProperty(Element.prototype, "getClientRects", {configurable:true, enumerable:true, writable:true, value: function (){return ldvm.toolsFunc.dispatch(this, Element.prototype, "Element", "getClientRects", arguments)}});
ldvm.toolsFunc.defineProperty(Element.prototype, "getElementsByClassName", {configurable:true, enumerable:true, writable:true, value: function (){return ldvm.toolsFunc.dispatch(this, Element.prototype, "Element", "getElementsByClassName", arguments)}});
ldvm.toolsFunc.defineProperty(Element.prototype, "getElementsByTagName", {configurable:true, enumerable:true, writable:true, value: function (){return ldvm.toolsFunc.dispatch(this, Element.prototype, "Element", "getElementsByTagName", arguments)}});
ldvm.toolsFunc.defineProperty(Element.prototype, "getElementsByTagNameNS", {configurable:true, enumerable:true, writable:true, value: function (){return ldvm.toolsFunc.dispatch(this, Element.prototype, "Element", "getElementsByTagNameNS", arguments)}});
ldvm.toolsFunc.defineProperty(Element.prototype, "getHTML", {configurable:true, enumerable:true, writable:true, value: function (){return ldvm.toolsFunc.dispatch(this, Element.prototype, "Element", "getHTML", arguments)}});
ldvm.toolsFunc.defineProperty(Element.prototype, "hasAttribute", {configurable:true, enumerable:true, writable:true, value: function (){return ldvm.toolsFunc.dispatch(this, Element.prototype, "Element", "hasAttribute", arguments)}});
ldvm.toolsFunc.defineProperty(Element.prototype, "hasAttributeNS", {configurable:true, enumerable:true, writable:true, value: function (){return ldvm.toolsFunc.dispatch(this, Element.prototype, "Element", "hasAttributeNS", arguments)}});
ldvm.toolsFunc.defineProperty(Element.prototype, "hasAttributes", {configurable:true, enumerable:true, writable:true, value: function (){return ldvm.toolsFunc.dispatch(this, Element.prototype, "Element", "hasAttributes", arguments)}});
ldvm.toolsFunc.defineProperty(Element.prototype, "hasPointerCapture", {configurable:true, enumerable:true, writable:true, value: function (){return ldvm.toolsFunc.dispatch(this, Element.prototype, "Element", "hasPointerCapture", arguments)}});
ldvm.toolsFunc.defineProperty(Element.prototype, "insertAdjacentElement", {configurable:true, enumerable:true, writable:true, value: function (){return ldvm.toolsFunc.dispatch(this, Element.prototype, "Element", "insertAdjacentElement", arguments)}});
ldvm.toolsFunc.defineProperty(Element.prototype, "insertAdjacentHTML", {configurable:true, enumerable:true, writable:true, value: function (){return ldvm.toolsFunc.dispatch(this, Element.prototype, "Element", "insertAdjacentHTML", arguments)}});
ldvm.toolsFunc.defineProperty(Element.prototype, "insertAdjacentText", {configurable:true, enumerable:true, writable:true, value: function (){return ldvm.toolsFunc.dispatch(this, Element.prototype, "Element", "insertAdjacentText", arguments)}});
ldvm.toolsFunc.defineProperty(Element.prototype, "matches", {configurable:true, enumerable:true, writable:true, value: function (){return ldvm.toolsFunc.dispatch(this, Element.prototype, "Element", "matches", arguments)}});
ldvm.toolsFunc.defineProperty(Element.prototype, "moveBefore", {configurable:true, enumerable:true, writable:true, value: function (){return ldvm.toolsFunc.dispatch(this, Element.prototype, "Element", "moveBefore", arguments)}});
ldvm.toolsFunc.defineProperty(Element.prototype, "prepend", {configurable:true, enumerable:true, writable:true, value: function (){return ldvm.toolsFunc.dispatch(this, Element.prototype, "Element", "prepend", arguments)}});
ldvm.toolsFunc.defineProperty(Element.prototype, "querySelector", {configurable:true, enumerable:true, writable:true, value: function (){return ldvm.toolsFunc.dispatch(this, Element.prototype, "Element", "querySelector", arguments)}});
ldvm.toolsFunc.defineProperty(Element.prototype, "querySelectorAll", {configurable:true, enumerable:true, writable:true, value: function (){return ldvm.toolsFunc.dispatch(this, Element.prototype, "Element", "querySelectorAll", arguments)}});
ldvm.toolsFunc.defineProperty(Element.prototype, "releasePointerCapture", {configurable:true, enumerable:true, writable:true, value: function (){return ldvm.toolsFunc.dispatch(this, Element.prototype, "Element", "releasePointerCapture", arguments)}});
ldvm.toolsFunc.defineProperty(Element.prototype, "remove", {configurable:true, enumerable:true, writable:true, value: function (){return ldvm.toolsFunc.dispatch(this, Element.prototype, "Element", "remove", arguments)}});
ldvm.toolsFunc.defineProperty(Element.prototype, "removeAttribute", {configurable:true, enumerable:true, writable:true, value: function (){return ldvm.toolsFunc.dispatch(this, Element.prototype, "Element", "removeAttribute", arguments)}});
ldvm.toolsFunc.defineProperty(Element.prototype, "removeAttributeNS", {configurable:true, enumerable:true, writable:true, value: function (){return ldvm.toolsFunc.dispatch(this, Element.prototype, "Element", "removeAttributeNS", arguments)}});
ldvm.toolsFunc.defineProperty(Element.prototype, "removeAttributeNode", {configurable:true, enumerable:true, writable:true, value: function (){return ldvm.toolsFunc.dispatch(this, Element.prototype, "Element", "removeAttributeNode", arguments)}});
ldvm.toolsFunc.defineProperty(Element.prototype, "replaceChildren", {configurable:true, enumerable:true, writable:true, value: function (){return ldvm.toolsFunc.dispatch(this, Element.prototype, "Element", "replaceChildren", arguments)}});
ldvm.toolsFunc.defineProperty(Element.prototype, "replaceWith", {configurable:true, enumerable:true, writable:true, value: function (){return ldvm.toolsFunc.dispatch(this, Element.prototype, "Element", "replaceWith", arguments)}});
ldvm.toolsFunc.defineProperty(Element.prototype, "requestFullscreen", {configurable:true, enumerable:true, writable:true, value: function (){return ldvm.toolsFunc.dispatch(this, Element.prototype, "Element", "requestFullscreen", arguments)}});
ldvm.toolsFunc.defineProperty(Element.prototype, "requestPointerLock", {configurable:true, enumerable:true, writable:true, value: function (){return ldvm.toolsFunc.dispatch(this, Element.prototype, "Element", "requestPointerLock", arguments)}});
ldvm.toolsFunc.defineProperty(Element.prototype, "scroll", {configurable:true, enumerable:true, writable:true, value: function (){return ldvm.toolsFunc.dispatch(this, Element.prototype, "Element", "scroll", arguments)}});
ldvm.toolsFunc.defineProperty(Element.prototype, "scrollBy", {configurable:true, enumerable:true, writable:true, value: function (){return ldvm.toolsFunc.dispatch(this, Element.prototype, "Element", "scrollBy", arguments)}});
ldvm.toolsFunc.defineProperty(Element.prototype, "scrollIntoView", {configurable:true, enumerable:true, writable:true, value: function (){return ldvm.toolsFunc.dispatch(this, Element.prototype, "Element", "scrollIntoView", arguments)}});
ldvm.toolsFunc.defineProperty(Element.prototype, "scrollIntoViewIfNeeded", {configurable:true, enumerable:true, writable:true, value: function (){return ldvm.toolsFunc.dispatch(this, Element.prototype, "Element", "scrollIntoViewIfNeeded", arguments)}});
ldvm.toolsFunc.defineProperty(Element.prototype, "scrollTo", {configurable:true, enumerable:true, writable:true, value: function (){return ldvm.toolsFunc.dispatch(this, Element.prototype, "Element", "scrollTo", arguments)}});
ldvm.toolsFunc.defineProperty(Element.prototype, "setAttribute", {configurable:true, enumerable:true, writable:true, value: function (){return ldvm.toolsFunc.dispatch(this, Element.prototype, "Element", "setAttribute", arguments)}});
ldvm.toolsFunc.defineProperty(Element.prototype, "setAttributeNS", {configurable:true, enumerable:true, writable:true, value: function (){return ldvm.toolsFunc.dispatch(this, Element.prototype, "Element", "setAttributeNS", arguments)}});
ldvm.toolsFunc.defineProperty(Element.prototype, "setAttributeNode", {configurable:true, enumerable:true, writable:true, value: function (){return ldvm.toolsFunc.dispatch(this, Element.prototype, "Element", "setAttributeNode", arguments)}});
ldvm.toolsFunc.defineProperty(Element.prototype, "setAttributeNodeNS", {configurable:true, enumerable:true, writable:true, value: function (){return ldvm.toolsFunc.dispatch(this, Element.prototype, "Element", "setAttributeNodeNS", arguments)}});
ldvm.toolsFunc.defineProperty(Element.prototype, "setHTMLUnsafe", {configurable:true, enumerable:true, writable:true, value: function (){return ldvm.toolsFunc.dispatch(this, Element.prototype, "Element", "setHTMLUnsafe", arguments)}});
ldvm.toolsFunc.defineProperty(Element.prototype, "setPointerCapture", {configurable:true, enumerable:true, writable:true, value: function (){return ldvm.toolsFunc.dispatch(this, Element.prototype, "Element", "setPointerCapture", arguments)}});
ldvm.toolsFunc.defineProperty(Element.prototype, "toggleAttribute", {configurable:true, enumerable:true, writable:true, value: function (){return ldvm.toolsFunc.dispatch(this, Element.prototype, "Element", "toggleAttribute", arguments)}});
ldvm.toolsFunc.defineProperty(Element.prototype, "webkitMatchesSelector", {configurable:true, enumerable:true, writable:true, value: function (){return ldvm.toolsFunc.dispatch(this, Element.prototype, "Element", "webkitMatchesSelector", arguments)}});
ldvm.toolsFunc.defineProperty(Element.prototype, "webkitRequestFullScreen", {configurable:true, enumerable:true, writable:true, value: function (){return ldvm.toolsFunc.dispatch(this, Element.prototype, "Element", "webkitRequestFullScreen", arguments)}});
ldvm.toolsFunc.defineProperty(Element.prototype, "webkitRequestFullscreen", {configurable:true, enumerable:true, writable:true, value: function (){return ldvm.toolsFunc.dispatch(this, Element.prototype, "Element", "webkitRequestFullscreen", arguments)}});
ldvm.toolsFunc.defineProperty(Element.prototype, "currentCSSZoom", {configurable:true, enumerable:true, get: function (){return ldvm.toolsFunc.dispatch(this, Element.prototype, "Element", "currentCSSZoom_get", arguments)},set:undefined});
ldvm.toolsFunc.defineProperty(Element.prototype, "customElementRegistry", {configurable:true, enumerable:true, get: function (){return ldvm.toolsFunc.dispatch(this, Element.prototype, "Element", "customElementRegistry_get", arguments)},set:undefined});
ldvm.toolsFunc.defineProperty(Element.prototype, "activeViewTransition", {configurable:true, enumerable:true, get: function (){return ldvm.toolsFunc.dispatch(this, Element.prototype, "Element", "activeViewTransition_get", arguments)},set:undefined});
ldvm.toolsFunc.defineProperty(Element.prototype, "ariaColIndexText", {configurable:true, enumerable:true, get: function (){return ldvm.toolsFunc.dispatch(this, Element.prototype, "Element", "ariaColIndexText_get", arguments)},set: function (){return ldvm.toolsFunc.dispatch(this, Element.prototype, "Element", "ariaColIndexText_set", arguments)}});
ldvm.toolsFunc.defineProperty(Element.prototype, "ariaRowIndexText", {configurable:true, enumerable:true, get: function (){return ldvm.toolsFunc.dispatch(this, Element.prototype, "Element", "ariaRowIndexText_get", arguments)},set: function (){return ldvm.toolsFunc.dispatch(this, Element.prototype, "Element", "ariaRowIndexText_set", arguments)}});
ldvm.toolsFunc.defineProperty(Element.prototype, "ariaActiveDescendantElement", {configurable:true, enumerable:true, get: function (){return ldvm.toolsFunc.dispatch(this, Element.prototype, "Element", "ariaActiveDescendantElement_get", arguments)},set: function (){return ldvm.toolsFunc.dispatch(this, Element.prototype, "Element", "ariaActiveDescendantElement_set", arguments)}});
ldvm.toolsFunc.defineProperty(Element.prototype, "ariaControlsElements", {configurable:true, enumerable:true, get: function (){return ldvm.toolsFunc.dispatch(this, Element.prototype, "Element", "ariaControlsElements_get", arguments)},set: function (){return ldvm.toolsFunc.dispatch(this, Element.prototype, "Element", "ariaControlsElements_set", arguments)}});
ldvm.toolsFunc.defineProperty(Element.prototype, "ariaDescribedByElements", {configurable:true, enumerable:true, get: function (){return ldvm.toolsFunc.dispatch(this, Element.prototype, "Element", "ariaDescribedByElements_get", arguments)},set: function (){return ldvm.toolsFunc.dispatch(this, Element.prototype, "Element", "ariaDescribedByElements_set", arguments)}});
ldvm.toolsFunc.defineProperty(Element.prototype, "ariaDetailsElements", {configurable:true, enumerable:true, get: function (){return ldvm.toolsFunc.dispatch(this, Element.prototype, "Element", "ariaDetailsElements_get", arguments)},set: function (){return ldvm.toolsFunc.dispatch(this, Element.prototype, "Element", "ariaDetailsElements_set", arguments)}});
ldvm.toolsFunc.defineProperty(Element.prototype, "ariaErrorMessageElements", {configurable:true, enumerable:true, get: function (){return ldvm.toolsFunc.dispatch(this, Element.prototype, "Element", "ariaErrorMessageElements_get", arguments)},set: function (){return ldvm.toolsFunc.dispatch(this, Element.prototype, "Element", "ariaErrorMessageElements_set", arguments)}});
ldvm.toolsFunc.defineProperty(Element.prototype, "ariaFlowToElements", {configurable:true, enumerable:true, get: function (){return ldvm.toolsFunc.dispatch(this, Element.prototype, "Element", "ariaFlowToElements_get", arguments)},set: function (){return ldvm.toolsFunc.dispatch(this, Element.prototype, "Element", "ariaFlowToElements_set", arguments)}});
ldvm.toolsFunc.defineProperty(Element.prototype, "ariaLabelledByElements", {configurable:true, enumerable:true, get: function (){return ldvm.toolsFunc.dispatch(this, Element.prototype, "Element", "ariaLabelledByElements_get", arguments)},set: function (){return ldvm.toolsFunc.dispatch(this, Element.prototype, "Element", "ariaLabelledByElements_set", arguments)}});
ldvm.toolsFunc.defineProperty(Element.prototype, "ariaNotify", {configurable:true, enumerable:true, writable:true, value: function (){return ldvm.toolsFunc.dispatch(this, Element.prototype, "Element", "ariaNotify", arguments)}});
ldvm.toolsFunc.defineProperty(Element.prototype, "setHTML", {configurable:true, enumerable:true, writable:true, value: function (){return ldvm.toolsFunc.dispatch(this, Element.prototype, "Element", "setHTML", arguments)}});
ldvm.toolsFunc.defineProperty(Element.prototype, "startViewTransition", {configurable:true, enumerable:true, writable:true, value: function (){return ldvm.toolsFunc.dispatch(this, Element.prototype, "Element", "startViewTransition", arguments)}});

// HTMLElement对象
HTMLElement = function HTMLElement(){ldvm.toolsFunc.throwError("TypeError", "Failed to construct 'HTMLElement': Illegal constructor")}
ldvm.toolsFunc.safeProto(HTMLElement, "HTMLElement");
Object.setPrototypeOf(HTMLElement.prototype, Element.prototype);

// HTMLAnchorElement对象
HTMLAnchorElement = function HTMLAnchorElement(){ldvm.toolsFunc.throwError("TypeError", "Failed to construct 'HTMLAnchorElement': Illegal constructor")}
ldvm.toolsFunc.safeProto(HTMLAnchorElement, "HTMLAnchorElement");
Object.setPrototypeOf(HTMLAnchorElement.prototype, HTMLElement.prototype);
ldvm.toolsFunc.defineProperty(HTMLAnchorElement.prototype, "target", {configurable:true, enumerable:true, get: function (){return ldvm.toolsFunc.dispatch(this, HTMLAnchorElement.prototype, "HTMLAnchorElement", "target_get", arguments)},set: function (){return ldvm.toolsFunc.dispatch(this, HTMLAnchorElement.prototype, "HTMLAnchorElement", "target_set", arguments)}});
ldvm.toolsFunc.defineProperty(HTMLAnchorElement.prototype, "download", {configurable:true, enumerable:true, get: function (){return ldvm.toolsFunc.dispatch(this, HTMLAnchorElement.prototype, "HTMLAnchorElement", "download_get", arguments)},set: function (){return ldvm.toolsFunc.dispatch(this, HTMLAnchorElement.prototype, "HTMLAnchorElement", "download_set", arguments)}});
ldvm.toolsFunc.defineProperty(HTMLAnchorElement.prototype, "ping", {configurable:true, enumerable:true, get: function (){return ldvm.toolsFunc.dispatch(this, HTMLAnchorElement.prototype, "HTMLAnchorElement", "ping_get", arguments)},set: function (){return ldvm.toolsFunc.dispatch(this, HTMLAnchorElement.prototype, "HTMLAnchorElement", "ping_set", arguments)}});
ldvm.toolsFunc.defineProperty(HTMLAnchorElement.prototype, "rel", {configurable:true, enumerable:true, get: function (){return ldvm.toolsFunc.dispatch(this, HTMLAnchorElement.prototype, "HTMLAnchorElement", "rel_get", arguments)},set: function (){return ldvm.toolsFunc.dispatch(this, HTMLAnchorElement.prototype, "HTMLAnchorElement", "rel_set", arguments)}});
ldvm.toolsFunc.defineProperty(HTMLAnchorElement.prototype, "relList", {configurable:true, enumerable:true, get: function (){return ldvm.toolsFunc.dispatch(this, HTMLAnchorElement.prototype, "HTMLAnchorElement", "relList_get", arguments)},set: function (){return ldvm.toolsFunc.dispatch(this, HTMLAnchorElement.prototype, "HTMLAnchorElement", "relList_set", arguments)}});
ldvm.toolsFunc.defineProperty(HTMLAnchorElement.prototype, "hreflang", {configurable:true, enumerable:true, get: function (){return ldvm.toolsFunc.dispatch(this, HTMLAnchorElement.prototype, "HTMLAnchorElement", "hreflang_get", arguments)},set: function (){return ldvm.toolsFunc.dispatch(this, HTMLAnchorElement.prototype, "HTMLAnchorElement", "hreflang_set", arguments)}});
ldvm.toolsFunc.defineProperty(HTMLAnchorElement.prototype, "type", {configurable:true, enumerable:true, get: function (){return ldvm.toolsFunc.dispatch(this, HTMLAnchorElement.prototype, "HTMLAnchorElement", "type_get", arguments)},set: function (){return ldvm.toolsFunc.dispatch(this, HTMLAnchorElement.prototype, "HTMLAnchorElement", "type_set", arguments)}});
ldvm.toolsFunc.defineProperty(HTMLAnchorElement.prototype, "referrerPolicy", {configurable:true, enumerable:true, get: function (){return ldvm.toolsFunc.dispatch(this, HTMLAnchorElement.prototype, "HTMLAnchorElement", "referrerPolicy_get", arguments)},set: function (){return ldvm.toolsFunc.dispatch(this, HTMLAnchorElement.prototype, "HTMLAnchorElement", "referrerPolicy_set", arguments)}});
ldvm.toolsFunc.defineProperty(HTMLAnchorElement.prototype, "text", {configurable:true, enumerable:true, get: function (){return ldvm.toolsFunc.dispatch(this, HTMLAnchorElement.prototype, "HTMLAnchorElement", "text_get", arguments)},set: function (){return ldvm.toolsFunc.dispatch(this, HTMLAnchorElement.prototype, "HTMLAnchorElement", "text_set", arguments)}});
ldvm.toolsFunc.defineProperty(HTMLAnchorElement.prototype, "coords", {configurable:true, enumerable:true, get: function (){return ldvm.toolsFunc.dispatch(this, HTMLAnchorElement.prototype, "HTMLAnchorElement", "coords_get", arguments)},set: function (){return ldvm.toolsFunc.dispatch(this, HTMLAnchorElement.prototype, "HTMLAnchorElement", "coords_set", arguments)}});
ldvm.toolsFunc.defineProperty(HTMLAnchorElement.prototype, "charset", {configurable:true, enumerable:true, get: function (){return ldvm.toolsFunc.dispatch(this, HTMLAnchorElement.prototype, "HTMLAnchorElement", "charset_get", arguments)},set: function (){return ldvm.toolsFunc.dispatch(this, HTMLAnchorElement.prototype, "HTMLAnchorElement", "charset_set", arguments)}});
ldvm.toolsFunc.defineProperty(HTMLAnchorElement.prototype, "name", {configurable:true, enumerable:true, get: function (){return ldvm.toolsFunc.dispatch(this, HTMLAnchorElement.prototype, "HTMLAnchorElement", "name_get", arguments)},set: function (){return ldvm.toolsFunc.dispatch(this, HTMLAnchorElement.prototype, "HTMLAnchorElement", "name_set", arguments)}});
ldvm.toolsFunc.defineProperty(HTMLAnchorElement.prototype, "rev", {configurable:true, enumerable:true, get: function (){return ldvm.toolsFunc.dispatch(this, HTMLAnchorElement.prototype, "HTMLAnchorElement", "rev_get", arguments)},set: function (){return ldvm.toolsFunc.dispatch(this, HTMLAnchorElement.prototype, "HTMLAnchorElement", "rev_set", arguments)}});
ldvm.toolsFunc.defineProperty(HTMLAnchorElement.prototype, "shape", {configurable:true, enumerable:true, get: function (){return ldvm.toolsFunc.dispatch(this, HTMLAnchorElement.prototype, "HTMLAnchorElement", "shape_get", arguments)},set: function (){return ldvm.toolsFunc.dispatch(this, HTMLAnchorElement.prototype, "HTMLAnchorElement", "shape_set", arguments)}});
ldvm.toolsFunc.defineProperty(HTMLAnchorElement.prototype, "origin", {configurable:true, enumerable:true, get: function (){return ldvm.toolsFunc.dispatch(this, HTMLAnchorElement.prototype, "HTMLAnchorElement", "origin_get", arguments)},set:undefined});
ldvm.toolsFunc.defineProperty(HTMLAnchorElement.prototype, "protocol", {configurable:true, enumerable:true, get: function (){return ldvm.toolsFunc.dispatch(this, HTMLAnchorElement.prototype, "HTMLAnchorElement", "protocol_get", arguments)},set: function (){return ldvm.toolsFunc.dispatch(this, HTMLAnchorElement.prototype, "HTMLAnchorElement", "protocol_set", arguments)}});
ldvm.toolsFunc.defineProperty(HTMLAnchorElement.prototype, "username", {configurable:true, enumerable:true, get: function (){return ldvm.toolsFunc.dispatch(this, HTMLAnchorElement.prototype, "HTMLAnchorElement", "username_get", arguments)},set: function (){return ldvm.toolsFunc.dispatch(this, HTMLAnchorElement.prototype, "HTMLAnchorElement", "username_set", arguments)}});
ldvm.toolsFunc.defineProperty(HTMLAnchorElement.prototype, "password", {configurable:true, enumerable:true, get: function (){return ldvm.toolsFunc.dispatch(this, HTMLAnchorElement.prototype, "HTMLAnchorElement", "password_get", arguments)},set: function (){return ldvm.toolsFunc.dispatch(this, HTMLAnchorElement.prototype, "HTMLAnchorElement", "password_set", arguments)}});
ldvm.toolsFunc.defineProperty(HTMLAnchorElement.prototype, "host", {configurable:true, enumerable:true, get: function (){return ldvm.toolsFunc.dispatch(this, HTMLAnchorElement.prototype, "HTMLAnchorElement", "host_get", arguments)},set: function (){return ldvm.toolsFunc.dispatch(this, HTMLAnchorElement.prototype, "HTMLAnchorElement", "host_set", arguments)}});
ldvm.toolsFunc.defineProperty(HTMLAnchorElement.prototype, "hostname", {configurable:true, enumerable:true, get: function (){return ldvm.toolsFunc.dispatch(this, HTMLAnchorElement.prototype, "HTMLAnchorElement", "hostname_get", arguments)},set: function (){return ldvm.toolsFunc.dispatch(this, HTMLAnchorElement.prototype, "HTMLAnchorElement", "hostname_set", arguments)}});
ldvm.toolsFunc.defineProperty(HTMLAnchorElement.prototype, "port", {configurable:true, enumerable:true, get: function (){return ldvm.toolsFunc.dispatch(this, HTMLAnchorElement.prototype, "HTMLAnchorElement", "port_get", arguments)},set: function (){return ldvm.toolsFunc.dispatch(this, HTMLAnchorElement.prototype, "HTMLAnchorElement", "port_set", arguments)}});
ldvm.toolsFunc.defineProperty(HTMLAnchorElement.prototype, "pathname", {configurable:true, enumerable:true, get: function (){return ldvm.toolsFunc.dispatch(this, HTMLAnchorElement.prototype, "HTMLAnchorElement", "pathname_get", arguments)},set: function (){return ldvm.toolsFunc.dispatch(this, HTMLAnchorElement.prototype, "HTMLAnchorElement", "pathname_set", arguments)}});
ldvm.toolsFunc.defineProperty(HTMLAnchorElement.prototype, "search", {configurable:true, enumerable:true, get: function (){return ldvm.toolsFunc.dispatch(this, HTMLAnchorElement.prototype, "HTMLAnchorElement", "search_get", arguments)},set: function (){return ldvm.toolsFunc.dispatch(this, HTMLAnchorElement.prototype, "HTMLAnchorElement", "search_set", arguments)}});
ldvm.toolsFunc.defineProperty(HTMLAnchorElement.prototype, "hash", {configurable:true, enumerable:true, get: function (){return ldvm.toolsFunc.dispatch(this, HTMLAnchorElement.prototype, "HTMLAnchorElement", "hash_get", arguments)},set: function (){return ldvm.toolsFunc.dispatch(this, HTMLAnchorElement.prototype, "HTMLAnchorElement", "hash_set", arguments)}});
ldvm.toolsFunc.defineProperty(HTMLAnchorElement.prototype, "href", {configurable:true, enumerable:true, get: function (){return ldvm.toolsFunc.dispatch(this, HTMLAnchorElement.prototype, "HTMLAnchorElement", "href_get", arguments)},set: function (){return ldvm.toolsFunc.dispatch(this, HTMLAnchorElement.prototype, "HTMLAnchorElement", "href_set", arguments)}});
ldvm.toolsFunc.defineProperty(HTMLAnchorElement.prototype, "toString", {configurable:true, enumerable:true, writable:true, value: function (){return ldvm.toolsFunc.dispatch(this, HTMLAnchorElement.prototype, "HTMLAnchorElement", "toString", arguments)}});
ldvm.toolsFunc.defineProperty(HTMLAnchorElement.prototype, "interestForElement", {configurable:true, enumerable:true, get: function (){return ldvm.toolsFunc.dispatch(this, HTMLAnchorElement.prototype, "HTMLAnchorElement", "interestForElement_get", arguments)},set: function (){return ldvm.toolsFunc.dispatch(this, HTMLAnchorElement.prototype, "HTMLAnchorElement", "interestForElement_set", arguments)}});
ldvm.toolsFunc.defineProperty(HTMLAnchorElement.prototype, "hrefTranslate", {configurable:true, enumerable:true, get: function (){return ldvm.toolsFunc.dispatch(this, HTMLAnchorElement.prototype, "HTMLAnchorElement", "hrefTranslate_get", arguments)},set: function (){return ldvm.toolsFunc.dispatch(this, HTMLAnchorElement.prototype, "HTMLAnchorElement", "hrefTranslate_set", arguments)}});

// HTMLBodyElement对象
HTMLBodyElement = function HTMLBodyElement(){ldvm.toolsFunc.throwError("TypeError", "Failed to construct 'HTMLBodyElement': Illegal constructor")}
ldvm.toolsFunc.safeProto(HTMLBodyElement, "HTMLBodyElement");
Object.setPrototypeOf(HTMLBodyElement.prototype, HTMLElement.prototype);
ldvm.toolsFunc.defineProperty(HTMLBodyElement.prototype, "text", {configurable:true, enumerable:true, get: function (){return ldvm.toolsFunc.dispatch(this, HTMLBodyElement.prototype, "HTMLBodyElement", "text_get", arguments)},set: function (){return ldvm.toolsFunc.dispatch(this, HTMLBodyElement.prototype, "HTMLBodyElement", "text_set", arguments)}});
ldvm.toolsFunc.defineProperty(HTMLBodyElement.prototype, "link", {configurable:true, enumerable:true, get: function (){return ldvm.toolsFunc.dispatch(this, HTMLBodyElement.prototype, "HTMLBodyElement", "link_get", arguments)},set: function (){return ldvm.toolsFunc.dispatch(this, HTMLBodyElement.prototype, "HTMLBodyElement", "link_set", arguments)}});
ldvm.toolsFunc.defineProperty(HTMLBodyElement.prototype, "vLink", {configurable:true, enumerable:true, get: function (){return ldvm.toolsFunc.dispatch(this, HTMLBodyElement.prototype, "HTMLBodyElement", "vLink_get", arguments)},set: function (){return ldvm.toolsFunc.dispatch(this, HTMLBodyElement.prototype, "HTMLBodyElement", "vLink_set", arguments)}});
ldvm.toolsFunc.defineProperty(HTMLBodyElement.prototype, "aLink", {configurable:true, enumerable:true, get: function (){return ldvm.toolsFunc.dispatch(this, HTMLBodyElement.prototype, "HTMLBodyElement", "aLink_get", arguments)},set: function (){return ldvm.toolsFunc.dispatch(this, HTMLBodyElement.prototype, "HTMLBodyElement", "aLink_set", arguments)}});
ldvm.toolsFunc.defineProperty(HTMLBodyElement.prototype, "bgColor", {configurable:true, enumerable:true, get: function (){return ldvm.toolsFunc.dispatch(this, HTMLBodyElement.prototype, "HTMLBodyElement", "bgColor_get", arguments)},set: function (){return ldvm.toolsFunc.dispatch(this, HTMLBodyElement.prototype, "HTMLBodyElement", "bgColor_set", arguments)}});
ldvm.toolsFunc.defineProperty(HTMLBodyElement.prototype, "background", {configurable:true, enumerable:true, get: function (){return ldvm.toolsFunc.dispatch(this, HTMLBodyElement.prototype, "HTMLBodyElement", "background_get", arguments)},set: function (){return ldvm.toolsFunc.dispatch(this, HTMLBodyElement.prototype, "HTMLBodyElement", "background_set", arguments)}});
ldvm.toolsFunc.defineProperty(HTMLBodyElement.prototype, "onblur", {configurable:true, enumerable:true, get: function (){return ldvm.toolsFunc.dispatch(this, HTMLBodyElement.prototype, "HTMLBodyElement", "onblur_get", arguments)},set: function (){return ldvm.toolsFunc.dispatch(this, HTMLBodyElement.prototype, "HTMLBodyElement", "onblur_set", arguments)}});
ldvm.toolsFunc.defineProperty(HTMLBodyElement.prototype, "onerror", {configurable:true, enumerable:true, get: function (){return ldvm.toolsFunc.dispatch(this, HTMLBodyElement.prototype, "HTMLBodyElement", "onerror_get", arguments)},set: function (){return ldvm.toolsFunc.dispatch(this, HTMLBodyElement.prototype, "HTMLBodyElement", "onerror_set", arguments)}});
ldvm.toolsFunc.defineProperty(HTMLBodyElement.prototype, "onfocus", {configurable:true, enumerable:true, get: function (){return ldvm.toolsFunc.dispatch(this, HTMLBodyElement.prototype, "HTMLBodyElement", "onfocus_get", arguments)},set: function (){return ldvm.toolsFunc.dispatch(this, HTMLBodyElement.prototype, "HTMLBodyElement", "onfocus_set", arguments)}});
ldvm.toolsFunc.defineProperty(HTMLBodyElement.prototype, "onload", {configurable:true, enumerable:true, get: function (){return ldvm.toolsFunc.dispatch(this, HTMLBodyElement.prototype, "HTMLBodyElement", "onload_get", arguments)},set: function (){return ldvm.toolsFunc.dispatch(this, HTMLBodyElement.prototype, "HTMLBodyElement", "onload_set", arguments)}});
ldvm.toolsFunc.defineProperty(HTMLBodyElement.prototype, "onresize", {configurable:true, enumerable:true, get: function (){return ldvm.toolsFunc.dispatch(this, HTMLBodyElement.prototype, "HTMLBodyElement", "onresize_get", arguments)},set: function (){return ldvm.toolsFunc.dispatch(this, HTMLBodyElement.prototype, "HTMLBodyElement", "onresize_set", arguments)}});
ldvm.toolsFunc.defineProperty(HTMLBodyElement.prototype, "onscroll", {configurable:true, enumerable:true, get: function (){return ldvm.toolsFunc.dispatch(this, HTMLBodyElement.prototype, "HTMLBodyElement", "onscroll_get", arguments)},set: function (){return ldvm.toolsFunc.dispatch(this, HTMLBodyElement.prototype, "HTMLBodyElement", "onscroll_set", arguments)}});
ldvm.toolsFunc.defineProperty(HTMLBodyElement.prototype, "onafterprint", {configurable:true, enumerable:true, get: function (){return ldvm.toolsFunc.dispatch(this, HTMLBodyElement.prototype, "HTMLBodyElement", "onafterprint_get", arguments)},set: function (){return ldvm.toolsFunc.dispatch(this, HTMLBodyElement.prototype, "HTMLBodyElement", "onafterprint_set", arguments)}});
ldvm.toolsFunc.defineProperty(HTMLBodyElement.prototype, "onbeforeprint", {configurable:true, enumerable:true, get: function (){return ldvm.toolsFunc.dispatch(this, HTMLBodyElement.prototype, "HTMLBodyElement", "onbeforeprint_get", arguments)},set: function (){return ldvm.toolsFunc.dispatch(this, HTMLBodyElement.prototype, "HTMLBodyElement", "onbeforeprint_set", arguments)}});
ldvm.toolsFunc.defineProperty(HTMLBodyElement.prototype, "onbeforeunload", {configurable:true, enumerable:true, get: function (){return ldvm.toolsFunc.dispatch(this, HTMLBodyElement.prototype, "HTMLBodyElement", "onbeforeunload_get", arguments)},set: function (){return ldvm.toolsFunc.dispatch(this, HTMLBodyElement.prototype, "HTMLBodyElement", "onbeforeunload_set", arguments)}});
ldvm.toolsFunc.defineProperty(HTMLBodyElement.prototype, "onhashchange", {configurable:true, enumerable:true, get: function (){return ldvm.toolsFunc.dispatch(this, HTMLBodyElement.prototype, "HTMLBodyElement", "onhashchange_get", arguments)},set: function (){return ldvm.toolsFunc.dispatch(this, HTMLBodyElement.prototype, "HTMLBodyElement", "onhashchange_set", arguments)}});
ldvm.toolsFunc.defineProperty(HTMLBodyElement.prototype, "onlanguagechange", {configurable:true, enumerable:true, get: function (){return ldvm.toolsFunc.dispatch(this, HTMLBodyElement.prototype, "HTMLBodyElement", "onlanguagechange_get", arguments)},set: function (){return ldvm.toolsFunc.dispatch(this, HTMLBodyElement.prototype, "HTMLBodyElement", "onlanguagechange_set", arguments)}});
ldvm.toolsFunc.defineProperty(HTMLBodyElement.prototype, "onmessage", {configurable:true, enumerable:true, get: function (){return ldvm.toolsFunc.dispatch(this, HTMLBodyElement.prototype, "HTMLBodyElement", "onmessage_get", arguments)},set: function (){return ldvm.toolsFunc.dispatch(this, HTMLBodyElement.prototype, "HTMLBodyElement", "onmessage_set", arguments)}});
ldvm.toolsFunc.defineProperty(HTMLBodyElement.prototype, "onmessageerror", {configurable:true, enumerable:true, get: function (){return ldvm.toolsFunc.dispatch(this, HTMLBodyElement.prototype, "HTMLBodyElement", "onmessageerror_get", arguments)},set: function (){return ldvm.toolsFunc.dispatch(this, HTMLBodyElement.prototype, "HTMLBodyElement", "onmessageerror_set", arguments)}});
ldvm.toolsFunc.defineProperty(HTMLBodyElement.prototype, "onoffline", {configurable:true, enumerable:true, get: function (){return ldvm.toolsFunc.dispatch(this, HTMLBodyElement.prototype, "HTMLBodyElement", "onoffline_get", arguments)},set: function (){return ldvm.toolsFunc.dispatch(this, HTMLBodyElement.prototype, "HTMLBodyElement", "onoffline_set", arguments)}});
ldvm.toolsFunc.defineProperty(HTMLBodyElement.prototype, "ononline", {configurable:true, enumerable:true, get: function (){return ldvm.toolsFunc.dispatch(this, HTMLBodyElement.prototype, "HTMLBodyElement", "ononline_get", arguments)},set: function (){return ldvm.toolsFunc.dispatch(this, HTMLBodyElement.prototype, "HTMLBodyElement", "ononline_set", arguments)}});
ldvm.toolsFunc.defineProperty(HTMLBodyElement.prototype, "onpagehide", {configurable:true, enumerable:true, get: function (){return ldvm.toolsFunc.dispatch(this, HTMLBodyElement.prototype, "HTMLBodyElement", "onpagehide_get", arguments)},set: function (){return ldvm.toolsFunc.dispatch(this, HTMLBodyElement.prototype, "HTMLBodyElement", "onpagehide_set", arguments)}});
ldvm.toolsFunc.defineProperty(HTMLBodyElement.prototype, "onpageshow", {configurable:true, enumerable:true, get: function (){return ldvm.toolsFunc.dispatch(this, HTMLBodyElement.prototype, "HTMLBodyElement", "onpageshow_get", arguments)},set: function (){return ldvm.toolsFunc.dispatch(this, HTMLBodyElement.prototype, "HTMLBodyElement", "onpageshow_set", arguments)}});
ldvm.toolsFunc.defineProperty(HTMLBodyElement.prototype, "onpopstate", {configurable:true, enumerable:true, get: function (){return ldvm.toolsFunc.dispatch(this, HTMLBodyElement.prototype, "HTMLBodyElement", "onpopstate_get", arguments)},set: function (){return ldvm.toolsFunc.dispatch(this, HTMLBodyElement.prototype, "HTMLBodyElement", "onpopstate_set", arguments)}});
ldvm.toolsFunc.defineProperty(HTMLBodyElement.prototype, "onrejectionhandled", {configurable:true, enumerable:true, get: function (){return ldvm.toolsFunc.dispatch(this, HTMLBodyElement.prototype, "HTMLBodyElement", "onrejectionhandled_get", arguments)},set: function (){return ldvm.toolsFunc.dispatch(this, HTMLBodyElement.prototype, "HTMLBodyElement", "onrejectionhandled_set", arguments)}});
ldvm.toolsFunc.defineProperty(HTMLBodyElement.prototype, "onstorage", {configurable:true, enumerable:true, get: function (){return ldvm.toolsFunc.dispatch(this, HTMLBodyElement.prototype, "HTMLBodyElement", "onstorage_get", arguments)},set: function (){return ldvm.toolsFunc.dispatch(this, HTMLBodyElement.prototype, "HTMLBodyElement", "onstorage_set", arguments)}});
ldvm.toolsFunc.defineProperty(HTMLBodyElement.prototype, "onunhandledrejection", {configurable:true, enumerable:true, get: function (){return ldvm.toolsFunc.dispatch(this, HTMLBodyElement.prototype, "HTMLBodyElement", "onunhandledrejection_get", arguments)},set: function (){return ldvm.toolsFunc.dispatch(this, HTMLBodyElement.prototype, "HTMLBodyElement", "onunhandledrejection_set", arguments)}});
ldvm.toolsFunc.defineProperty(HTMLBodyElement.prototype, "onunload", {configurable:true, enumerable:true, get: function (){return ldvm.toolsFunc.dispatch(this, HTMLBodyElement.prototype, "HTMLBodyElement", "onunload_get", arguments)},set: function (){return ldvm.toolsFunc.dispatch(this, HTMLBodyElement.prototype, "HTMLBodyElement", "onunload_set", arguments)}});
ldvm.toolsFunc.defineProperty(HTMLBodyElement.prototype, "onorientationchange", {configurable:true, enumerable:true, get: function (){return ldvm.toolsFunc.dispatch(this, HTMLBodyElement.prototype, "HTMLBodyElement", "onorientationchange_get", arguments)},set: function (){return ldvm.toolsFunc.dispatch(this, HTMLBodyElement.prototype, "HTMLBodyElement", "onorientationchange_set", arguments)}});
ldvm.toolsFunc.defineProperty(HTMLBodyElement.prototype, "ongamepadconnected", {configurable:true, enumerable:true, get: function (){return ldvm.toolsFunc.dispatch(this, HTMLBodyElement.prototype, "HTMLBodyElement", "ongamepadconnected_get", arguments)},set: function (){return ldvm.toolsFunc.dispatch(this, HTMLBodyElement.prototype, "HTMLBodyElement", "ongamepadconnected_set", arguments)}});
ldvm.toolsFunc.defineProperty(HTMLBodyElement.prototype, "ongamepaddisconnected", {configurable:true, enumerable:true, get: function (){return ldvm.toolsFunc.dispatch(this, HTMLBodyElement.prototype, "HTMLBodyElement", "ongamepaddisconnected_get", arguments)},set: function (){return ldvm.toolsFunc.dispatch(this, HTMLBodyElement.prototype, "HTMLBodyElement", "ongamepaddisconnected_set", arguments)}});

// HTMLCanvasElement对象
HTMLCanvasElement = function HTMLCanvasElement(){ldvm.toolsFunc.throwError("TypeError", "Failed to construct 'HTMLCanvasElement': Illegal constructor")}
ldvm.toolsFunc.safeProto(HTMLCanvasElement, "HTMLCanvasElement");
Object.setPrototypeOf(HTMLCanvasElement.prototype, HTMLElement.prototype);
ldvm.toolsFunc.defineProperty(HTMLCanvasElement.prototype, "width", {configurable:true, enumerable:true, get: function (){return ldvm.toolsFunc.dispatch(this, HTMLCanvasElement.prototype, "HTMLCanvasElement", "width_get", arguments)},set: function (){return ldvm.toolsFunc.dispatch(this, HTMLCanvasElement.prototype, "HTMLCanvasElement", "width_set", arguments)}});
ldvm.toolsFunc.defineProperty(HTMLCanvasElement.prototype, "height", {configurable:true, enumerable:true, get: function (){return ldvm.toolsFunc.dispatch(this, HTMLCanvasElement.prototype, "HTMLCanvasElement", "height_get", arguments)},set: function (){return ldvm.toolsFunc.dispatch(this, HTMLCanvasElement.prototype, "HTMLCanvasElement", "height_set", arguments)}});
ldvm.toolsFunc.defineProperty(HTMLCanvasElement.prototype, "captureStream", {configurable:true, enumerable:true, writable:true, value: function (){return ldvm.toolsFunc.dispatch(this, HTMLCanvasElement.prototype, "HTMLCanvasElement", "captureStream", arguments)}});
ldvm.toolsFunc.defineProperty(HTMLCanvasElement.prototype, "getContext", {configurable:true, enumerable:true, writable:true, value: function (){return ldvm.toolsFunc.dispatch(this, HTMLCanvasElement.prototype, "HTMLCanvasElement", "getContext", arguments)}});
ldvm.toolsFunc.defineProperty(HTMLCanvasElement.prototype, "toBlob", {configurable:true, enumerable:true, writable:true, value: function (){return ldvm.toolsFunc.dispatch(this, HTMLCanvasElement.prototype, "HTMLCanvasElement", "toBlob", arguments)}});
ldvm.toolsFunc.defineProperty(HTMLCanvasElement.prototype, "toDataURL", {configurable:true, enumerable:true, writable:true, value: function (){return ldvm.toolsFunc.dispatch(this, HTMLCanvasElement.prototype, "HTMLCanvasElement", "toDataURL", arguments)}});
ldvm.toolsFunc.defineProperty(HTMLCanvasElement.prototype, "transferControlToOffscreen", {configurable:true, enumerable:true, writable:true, value: function (){return ldvm.toolsFunc.dispatch(this, HTMLCanvasElement.prototype, "HTMLCanvasElement", "transferControlToOffscreen", arguments)}});

// HTMLDivElement对象
HTMLDivElement = function HTMLDivElement(){ldvm.toolsFunc.throwError("TypeError", "Failed to construct 'HTMLDivElement': Illegal constructor")}
ldvm.toolsFunc.safeProto(HTMLDivElement, "HTMLDivElement");
Object.setPrototypeOf(HTMLDivElement.prototype, HTMLElement.prototype);
ldvm.toolsFunc.defineProperty(HTMLDivElement.prototype, "align", {configurable:true, enumerable:true, get: function (){return ldvm.toolsFunc.dispatch(this, HTMLDivElement.prototype, "HTMLDivElement", "align_get", arguments)},set: function (){return ldvm.toolsFunc.dispatch(this, HTMLDivElement.prototype, "HTMLDivElement", "align_set", arguments)}});
// HTMLHeadElement对象
HTMLHeadElement = function HTMLHeadElement(){ldvm.toolsFunc.throwError("TypeError", "Failed to construct 'HTMLHeadElement': Illegal constructor")}
ldvm.toolsFunc.safeProto(HTMLHeadElement, "HTMLHeadElement");
Object.setPrototypeOf(HTMLHeadElement.prototype, HTMLElement.prototype);

// HTMLInputElement对象
HTMLInputElement = function HTMLInputElement(){ldvm.toolsFunc.throwError("TypeError", "Failed to construct 'HTMLInputElement': Illegal constructor")}
ldvm.toolsFunc.safeProto(HTMLInputElement, "HTMLInputElement");
Object.setPrototypeOf(HTMLInputElement.prototype, HTMLElement.prototype);
ldvm.toolsFunc.defineProperty(HTMLInputElement.prototype, "accept", {configurable:true, enumerable:true, get: function (){return ldvm.toolsFunc.dispatch(this, HTMLInputElement.prototype, "HTMLInputElement", "accept_get", arguments)},set: function (){return ldvm.toolsFunc.dispatch(this, HTMLInputElement.prototype, "HTMLInputElement", "accept_set", arguments)}});
ldvm.toolsFunc.defineProperty(HTMLInputElement.prototype, "alt", {configurable:true, enumerable:true, get: function (){return ldvm.toolsFunc.dispatch(this, HTMLInputElement.prototype, "HTMLInputElement", "alt_get", arguments)},set: function (){return ldvm.toolsFunc.dispatch(this, HTMLInputElement.prototype, "HTMLInputElement", "alt_set", arguments)}});
ldvm.toolsFunc.defineProperty(HTMLInputElement.prototype, "autocomplete", {configurable:true, enumerable:true, get: function (){return ldvm.toolsFunc.dispatch(this, HTMLInputElement.prototype, "HTMLInputElement", "autocomplete_get", arguments)},set: function (){return ldvm.toolsFunc.dispatch(this, HTMLInputElement.prototype, "HTMLInputElement", "autocomplete_set", arguments)}});
ldvm.toolsFunc.defineProperty(HTMLInputElement.prototype, "defaultChecked", {configurable:true, enumerable:true, get: function (){return ldvm.toolsFunc.dispatch(this, HTMLInputElement.prototype, "HTMLInputElement", "defaultChecked_get", arguments)},set: function (){return ldvm.toolsFunc.dispatch(this, HTMLInputElement.prototype, "HTMLInputElement", "defaultChecked_set", arguments)}});
ldvm.toolsFunc.defineProperty(HTMLInputElement.prototype, "checked", {configurable:true, enumerable:true, get: function (){return ldvm.toolsFunc.dispatch(this, HTMLInputElement.prototype, "HTMLInputElement", "checked_get", arguments)},set: function (){return ldvm.toolsFunc.dispatch(this, HTMLInputElement.prototype, "HTMLInputElement", "checked_set", arguments)}});
ldvm.toolsFunc.defineProperty(HTMLInputElement.prototype, "dirName", {configurable:true, enumerable:true, get: function (){return ldvm.toolsFunc.dispatch(this, HTMLInputElement.prototype, "HTMLInputElement", "dirName_get", arguments)},set: function (){return ldvm.toolsFunc.dispatch(this, HTMLInputElement.prototype, "HTMLInputElement", "dirName_set", arguments)}});
ldvm.toolsFunc.defineProperty(HTMLInputElement.prototype, "disabled", {configurable:true, enumerable:true, get: function (){return ldvm.toolsFunc.dispatch(this, HTMLInputElement.prototype, "HTMLInputElement", "disabled_get", arguments)},set: function (){return ldvm.toolsFunc.dispatch(this, HTMLInputElement.prototype, "HTMLInputElement", "disabled_set", arguments)}});
ldvm.toolsFunc.defineProperty(HTMLInputElement.prototype, "form", {configurable:true, enumerable:true, get: function (){return ldvm.toolsFunc.dispatch(this, HTMLInputElement.prototype, "HTMLInputElement", "form_get", arguments)},set:undefined});
ldvm.toolsFunc.defineProperty(HTMLInputElement.prototype, "files", {configurable:true, enumerable:true, get: function (){return ldvm.toolsFunc.dispatch(this, HTMLInputElement.prototype, "HTMLInputElement", "files_get", arguments)},set: function (){return ldvm.toolsFunc.dispatch(this, HTMLInputElement.prototype, "HTMLInputElement", "files_set", arguments)}});
ldvm.toolsFunc.defineProperty(HTMLInputElement.prototype, "formAction", {configurable:true, enumerable:true, get: function (){return ldvm.toolsFunc.dispatch(this, HTMLInputElement.prototype, "HTMLInputElement", "formAction_get", arguments)},set: function (){return ldvm.toolsFunc.dispatch(this, HTMLInputElement.prototype, "HTMLInputElement", "formAction_set", arguments)}});
ldvm.toolsFunc.defineProperty(HTMLInputElement.prototype, "formEnctype", {configurable:true, enumerable:true, get: function (){return ldvm.toolsFunc.dispatch(this, HTMLInputElement.prototype, "HTMLInputElement", "formEnctype_get", arguments)},set: function (){return ldvm.toolsFunc.dispatch(this, HTMLInputElement.prototype, "HTMLInputElement", "formEnctype_set", arguments)}});
ldvm.toolsFunc.defineProperty(HTMLInputElement.prototype, "formMethod", {configurable:true, enumerable:true, get: function (){return ldvm.toolsFunc.dispatch(this, HTMLInputElement.prototype, "HTMLInputElement", "formMethod_get", arguments)},set: function (){return ldvm.toolsFunc.dispatch(this, HTMLInputElement.prototype, "HTMLInputElement", "formMethod_set", arguments)}});
ldvm.toolsFunc.defineProperty(HTMLInputElement.prototype, "formNoValidate", {configurable:true, enumerable:true, get: function (){return ldvm.toolsFunc.dispatch(this, HTMLInputElement.prototype, "HTMLInputElement", "formNoValidate_get", arguments)},set: function (){return ldvm.toolsFunc.dispatch(this, HTMLInputElement.prototype, "HTMLInputElement", "formNoValidate_set", arguments)}});
ldvm.toolsFunc.defineProperty(HTMLInputElement.prototype, "formTarget", {configurable:true, enumerable:true, get: function (){return ldvm.toolsFunc.dispatch(this, HTMLInputElement.prototype, "HTMLInputElement", "formTarget_get", arguments)},set: function (){return ldvm.toolsFunc.dispatch(this, HTMLInputElement.prototype, "HTMLInputElement", "formTarget_set", arguments)}});
ldvm.toolsFunc.defineProperty(HTMLInputElement.prototype, "height", {configurable:true, enumerable:true, get: function (){return ldvm.toolsFunc.dispatch(this, HTMLInputElement.prototype, "HTMLInputElement", "height_get", arguments)},set: function (){return ldvm.toolsFunc.dispatch(this, HTMLInputElement.prototype, "HTMLInputElement", "height_set", arguments)}});
ldvm.toolsFunc.defineProperty(HTMLInputElement.prototype, "indeterminate", {configurable:true, enumerable:true, get: function (){return ldvm.toolsFunc.dispatch(this, HTMLInputElement.prototype, "HTMLInputElement", "indeterminate_get", arguments)},set: function (){return ldvm.toolsFunc.dispatch(this, HTMLInputElement.prototype, "HTMLInputElement", "indeterminate_set", arguments)}});
ldvm.toolsFunc.defineProperty(HTMLInputElement.prototype, "list", {configurable:true, enumerable:true, get: function (){return ldvm.toolsFunc.dispatch(this, HTMLInputElement.prototype, "HTMLInputElement", "list_get", arguments)},set:undefined});
ldvm.toolsFunc.defineProperty(HTMLInputElement.prototype, "max", {configurable:true, enumerable:true, get: function (){return ldvm.toolsFunc.dispatch(this, HTMLInputElement.prototype, "HTMLInputElement", "max_get", arguments)},set: function (){return ldvm.toolsFunc.dispatch(this, HTMLInputElement.prototype, "HTMLInputElement", "max_set", arguments)}});
ldvm.toolsFunc.defineProperty(HTMLInputElement.prototype, "maxLength", {configurable:true, enumerable:true, get: function (){return ldvm.toolsFunc.dispatch(this, HTMLInputElement.prototype, "HTMLInputElement", "maxLength_get", arguments)},set: function (){return ldvm.toolsFunc.dispatch(this, HTMLInputElement.prototype, "HTMLInputElement", "maxLength_set", arguments)}});
ldvm.toolsFunc.defineProperty(HTMLInputElement.prototype, "min", {configurable:true, enumerable:true, get: function (){return ldvm.toolsFunc.dispatch(this, HTMLInputElement.prototype, "HTMLInputElement", "min_get", arguments)},set: function (){return ldvm.toolsFunc.dispatch(this, HTMLInputElement.prototype, "HTMLInputElement", "min_set", arguments)}});
ldvm.toolsFunc.defineProperty(HTMLInputElement.prototype, "minLength", {configurable:true, enumerable:true, get: function (){return ldvm.toolsFunc.dispatch(this, HTMLInputElement.prototype, "HTMLInputElement", "minLength_get", arguments)},set: function (){return ldvm.toolsFunc.dispatch(this, HTMLInputElement.prototype, "HTMLInputElement", "minLength_set", arguments)}});
ldvm.toolsFunc.defineProperty(HTMLInputElement.prototype, "multiple", {configurable:true, enumerable:true, get: function (){return ldvm.toolsFunc.dispatch(this, HTMLInputElement.prototype, "HTMLInputElement", "multiple_get", arguments)},set: function (){return ldvm.toolsFunc.dispatch(this, HTMLInputElement.prototype, "HTMLInputElement", "multiple_set", arguments)}});
ldvm.toolsFunc.defineProperty(HTMLInputElement.prototype, "name", {configurable:true, enumerable:true, get: function (){return ldvm.toolsFunc.dispatch(this, HTMLInputElement.prototype, "HTMLInputElement", "name_get", arguments)},set: function (){return ldvm.toolsFunc.dispatch(this, HTMLInputElement.prototype, "HTMLInputElement", "name_set", arguments)}});
ldvm.toolsFunc.defineProperty(HTMLInputElement.prototype, "pattern", {configurable:true, enumerable:true, get: function (){return ldvm.toolsFunc.dispatch(this, HTMLInputElement.prototype, "HTMLInputElement", "pattern_get", arguments)},set: function (){return ldvm.toolsFunc.dispatch(this, HTMLInputElement.prototype, "HTMLInputElement", "pattern_set", arguments)}});
ldvm.toolsFunc.defineProperty(HTMLInputElement.prototype, "placeholder", {configurable:true, enumerable:true, get: function (){return ldvm.toolsFunc.dispatch(this, HTMLInputElement.prototype, "HTMLInputElement", "placeholder_get", arguments)},set: function (){return ldvm.toolsFunc.dispatch(this, HTMLInputElement.prototype, "HTMLInputElement", "placeholder_set", arguments)}});
ldvm.toolsFunc.defineProperty(HTMLInputElement.prototype, "readOnly", {configurable:true, enumerable:true, get: function (){return ldvm.toolsFunc.dispatch(this, HTMLInputElement.prototype, "HTMLInputElement", "readOnly_get", arguments)},set: function (){return ldvm.toolsFunc.dispatch(this, HTMLInputElement.prototype, "HTMLInputElement", "readOnly_set", arguments)}});
ldvm.toolsFunc.defineProperty(HTMLInputElement.prototype, "required", {configurable:true, enumerable:true, get: function (){return ldvm.toolsFunc.dispatch(this, HTMLInputElement.prototype, "HTMLInputElement", "required_get", arguments)},set: function (){return ldvm.toolsFunc.dispatch(this, HTMLInputElement.prototype, "HTMLInputElement", "required_set", arguments)}});
ldvm.toolsFunc.defineProperty(HTMLInputElement.prototype, "size", {configurable:true, enumerable:true, get: function (){return ldvm.toolsFunc.dispatch(this, HTMLInputElement.prototype, "HTMLInputElement", "size_get", arguments)},set: function (){return ldvm.toolsFunc.dispatch(this, HTMLInputElement.prototype, "HTMLInputElement", "size_set", arguments)}});
ldvm.toolsFunc.defineProperty(HTMLInputElement.prototype, "src", {configurable:true, enumerable:true, get: function (){return ldvm.toolsFunc.dispatch(this, HTMLInputElement.prototype, "HTMLInputElement", "src_get", arguments)},set: function (){return ldvm.toolsFunc.dispatch(this, HTMLInputElement.prototype, "HTMLInputElement", "src_set", arguments)}});
ldvm.toolsFunc.defineProperty(HTMLInputElement.prototype, "step", {configurable:true, enumerable:true, get: function (){return ldvm.toolsFunc.dispatch(this, HTMLInputElement.prototype, "HTMLInputElement", "step_get", arguments)},set: function (){return ldvm.toolsFunc.dispatch(this, HTMLInputElement.prototype, "HTMLInputElement", "step_set", arguments)}});
ldvm.toolsFunc.defineProperty(HTMLInputElement.prototype, "type", {configurable:true, enumerable:true, get: function (){return ldvm.toolsFunc.dispatch(this, HTMLInputElement.prototype, "HTMLInputElement", "type_get", arguments)},set: function (){return ldvm.toolsFunc.dispatch(this, HTMLInputElement.prototype, "HTMLInputElement", "type_set", arguments)}});
ldvm.toolsFunc.defineProperty(HTMLInputElement.prototype, "defaultValue", {configurable:true, enumerable:true, get: function (){return ldvm.toolsFunc.dispatch(this, HTMLInputElement.prototype, "HTMLInputElement", "defaultValue_get", arguments)},set: function (){return ldvm.toolsFunc.dispatch(this, HTMLInputElement.prototype, "HTMLInputElement", "defaultValue_set", arguments)}});
ldvm.toolsFunc.defineProperty(HTMLInputElement.prototype, "value", {configurable:true, enumerable:true, get: function (){return ldvm.toolsFunc.dispatch(this, HTMLInputElement.prototype, "HTMLInputElement", "value_get", arguments)},set: function (){return ldvm.toolsFunc.dispatch(this, HTMLInputElement.prototype, "HTMLInputElement", "value_set", arguments)}});
ldvm.toolsFunc.defineProperty(HTMLInputElement.prototype, "valueAsDate", {configurable:true, enumerable:true, get: function (){return ldvm.toolsFunc.dispatch(this, HTMLInputElement.prototype, "HTMLInputElement", "valueAsDate_get", arguments)},set: function (){return ldvm.toolsFunc.dispatch(this, HTMLInputElement.prototype, "HTMLInputElement", "valueAsDate_set", arguments)}});
ldvm.toolsFunc.defineProperty(HTMLInputElement.prototype, "valueAsNumber", {configurable:true, enumerable:true, get: function (){return ldvm.toolsFunc.dispatch(this, HTMLInputElement.prototype, "HTMLInputElement", "valueAsNumber_get", arguments)},set: function (){return ldvm.toolsFunc.dispatch(this, HTMLInputElement.prototype, "HTMLInputElement", "valueAsNumber_set", arguments)}});
ldvm.toolsFunc.defineProperty(HTMLInputElement.prototype, "width", {configurable:true, enumerable:true, get: function (){return ldvm.toolsFunc.dispatch(this, HTMLInputElement.prototype, "HTMLInputElement", "width_get", arguments)},set: function (){return ldvm.toolsFunc.dispatch(this, HTMLInputElement.prototype, "HTMLInputElement", "width_set", arguments)}});
ldvm.toolsFunc.defineProperty(HTMLInputElement.prototype, "willValidate", {configurable:true, enumerable:true, get: function (){return ldvm.toolsFunc.dispatch(this, HTMLInputElement.prototype, "HTMLInputElement", "willValidate_get", arguments)},set:undefined});
ldvm.toolsFunc.defineProperty(HTMLInputElement.prototype, "validity", {configurable:true, enumerable:true, get: function (){return ldvm.toolsFunc.dispatch(this, HTMLInputElement.prototype, "HTMLInputElement", "validity_get", arguments)},set:undefined});
ldvm.toolsFunc.defineProperty(HTMLInputElement.prototype, "validationMessage", {configurable:true, enumerable:true, get: function (){return ldvm.toolsFunc.dispatch(this, HTMLInputElement.prototype, "HTMLInputElement", "validationMessage_get", arguments)},set:undefined});
ldvm.toolsFunc.defineProperty(HTMLInputElement.prototype, "labels", {configurable:true, enumerable:true, get: function (){return ldvm.toolsFunc.dispatch(this, HTMLInputElement.prototype, "HTMLInputElement", "labels_get", arguments)},set:undefined});
ldvm.toolsFunc.defineProperty(HTMLInputElement.prototype, "selectionStart", {configurable:true, enumerable:true, get: function (){return ldvm.toolsFunc.dispatch(this, HTMLInputElement.prototype, "HTMLInputElement", "selectionStart_get", arguments)},set: function (){return ldvm.toolsFunc.dispatch(this, HTMLInputElement.prototype, "HTMLInputElement", "selectionStart_set", arguments)}});
ldvm.toolsFunc.defineProperty(HTMLInputElement.prototype, "selectionEnd", {configurable:true, enumerable:true, get: function (){return ldvm.toolsFunc.dispatch(this, HTMLInputElement.prototype, "HTMLInputElement", "selectionEnd_get", arguments)},set: function (){return ldvm.toolsFunc.dispatch(this, HTMLInputElement.prototype, "HTMLInputElement", "selectionEnd_set", arguments)}});
ldvm.toolsFunc.defineProperty(HTMLInputElement.prototype, "selectionDirection", {configurable:true, enumerable:true, get: function (){return ldvm.toolsFunc.dispatch(this, HTMLInputElement.prototype, "HTMLInputElement", "selectionDirection_get", arguments)},set: function (){return ldvm.toolsFunc.dispatch(this, HTMLInputElement.prototype, "HTMLInputElement", "selectionDirection_set", arguments)}});
ldvm.toolsFunc.defineProperty(HTMLInputElement.prototype, "align", {configurable:true, enumerable:true, get: function (){return ldvm.toolsFunc.dispatch(this, HTMLInputElement.prototype, "HTMLInputElement", "align_get", arguments)},set: function (){return ldvm.toolsFunc.dispatch(this, HTMLInputElement.prototype, "HTMLInputElement", "align_set", arguments)}});
ldvm.toolsFunc.defineProperty(HTMLInputElement.prototype, "useMap", {configurable:true, enumerable:true, get: function (){return ldvm.toolsFunc.dispatch(this, HTMLInputElement.prototype, "HTMLInputElement", "useMap_get", arguments)},set: function (){return ldvm.toolsFunc.dispatch(this, HTMLInputElement.prototype, "HTMLInputElement", "useMap_set", arguments)}});
ldvm.toolsFunc.defineProperty(HTMLInputElement.prototype, "webkitdirectory", {configurable:true, enumerable:true, get: function (){return ldvm.toolsFunc.dispatch(this, HTMLInputElement.prototype, "HTMLInputElement", "webkitdirectory_get", arguments)},set: function (){return ldvm.toolsFunc.dispatch(this, HTMLInputElement.prototype, "HTMLInputElement", "webkitdirectory_set", arguments)}});
ldvm.toolsFunc.defineProperty(HTMLInputElement.prototype, "incremental", {configurable:true, enumerable:true, get: function (){return ldvm.toolsFunc.dispatch(this, HTMLInputElement.prototype, "HTMLInputElement", "incremental_get", arguments)},set: function (){return ldvm.toolsFunc.dispatch(this, HTMLInputElement.prototype, "HTMLInputElement", "incremental_set", arguments)}});
ldvm.toolsFunc.defineProperty(HTMLInputElement.prototype, "popoverTargetElement", {configurable:true, enumerable:true, get: function (){return ldvm.toolsFunc.dispatch(this, HTMLInputElement.prototype, "HTMLInputElement", "popoverTargetElement_get", arguments)},set: function (){return ldvm.toolsFunc.dispatch(this, HTMLInputElement.prototype, "HTMLInputElement", "popoverTargetElement_set", arguments)}});
ldvm.toolsFunc.defineProperty(HTMLInputElement.prototype, "popoverTargetAction", {configurable:true, enumerable:true, get: function (){return ldvm.toolsFunc.dispatch(this, HTMLInputElement.prototype, "HTMLInputElement", "popoverTargetAction_get", arguments)},set: function (){return ldvm.toolsFunc.dispatch(this, HTMLInputElement.prototype, "HTMLInputElement", "popoverTargetAction_set", arguments)}});
ldvm.toolsFunc.defineProperty(HTMLInputElement.prototype, "checkValidity", {configurable:true, enumerable:true, writable:true, value: function (){return ldvm.toolsFunc.dispatch(this, HTMLInputElement.prototype, "HTMLInputElement", "checkValidity", arguments)}});
ldvm.toolsFunc.defineProperty(HTMLInputElement.prototype, "reportValidity", {configurable:true, enumerable:true, writable:true, value: function (){return ldvm.toolsFunc.dispatch(this, HTMLInputElement.prototype, "HTMLInputElement", "reportValidity", arguments)}});
ldvm.toolsFunc.defineProperty(HTMLInputElement.prototype, "select", {configurable:true, enumerable:true, writable:true, value: function (){return ldvm.toolsFunc.dispatch(this, HTMLInputElement.prototype, "HTMLInputElement", "select", arguments)}});
ldvm.toolsFunc.defineProperty(HTMLInputElement.prototype, "setCustomValidity", {configurable:true, enumerable:true, writable:true, value: function (){return ldvm.toolsFunc.dispatch(this, HTMLInputElement.prototype, "HTMLInputElement", "setCustomValidity", arguments)}});
ldvm.toolsFunc.defineProperty(HTMLInputElement.prototype, "setRangeText", {configurable:true, enumerable:true, writable:true, value: function (){return ldvm.toolsFunc.dispatch(this, HTMLInputElement.prototype, "HTMLInputElement", "setRangeText", arguments)}});
ldvm.toolsFunc.defineProperty(HTMLInputElement.prototype, "setSelectionRange", {configurable:true, enumerable:true, writable:true, value: function (){return ldvm.toolsFunc.dispatch(this, HTMLInputElement.prototype, "HTMLInputElement", "setSelectionRange", arguments)}});
ldvm.toolsFunc.defineProperty(HTMLInputElement.prototype, "showPicker", {configurable:true, enumerable:true, writable:true, value: function (){return ldvm.toolsFunc.dispatch(this, HTMLInputElement.prototype, "HTMLInputElement", "showPicker", arguments)}});
ldvm.toolsFunc.defineProperty(HTMLInputElement.prototype, "stepDown", {configurable:true, enumerable:true, writable:true, value: function (){return ldvm.toolsFunc.dispatch(this, HTMLInputElement.prototype, "HTMLInputElement", "stepDown", arguments)}});
ldvm.toolsFunc.defineProperty(HTMLInputElement.prototype, "stepUp", {configurable:true, enumerable:true, writable:true, value: function (){return ldvm.toolsFunc.dispatch(this, HTMLInputElement.prototype, "HTMLInputElement", "stepUp", arguments)}});
ldvm.toolsFunc.defineProperty(HTMLInputElement.prototype, "webkitEntries", {configurable:true, enumerable:true, get: function (){return ldvm.toolsFunc.dispatch(this, HTMLInputElement.prototype, "HTMLInputElement", "webkitEntries_get", arguments)},set:undefined});

// HTMLMetaElement对象
HTMLMetaElement = function HTMLMetaElement(){ldvm.toolsFunc.throwError("TypeError", "Failed to construct 'HTMLMetaElement': Illegal constructor")}
ldvm.toolsFunc.safeProto(HTMLMetaElement, "HTMLMetaElement");
Object.setPrototypeOf(HTMLMetaElement.prototype, HTMLElement.prototype);
ldvm.toolsFunc.defineProperty(HTMLMetaElement.prototype, "name", {configurable:true, enumerable:true, get: function (){return ldvm.toolsFunc.dispatch(this, HTMLMetaElement.prototype, "HTMLMetaElement", "name_get", arguments)},set: function (){return ldvm.toolsFunc.dispatch(this, HTMLMetaElement.prototype, "HTMLMetaElement", "name_set", arguments)}});
ldvm.toolsFunc.defineProperty(HTMLMetaElement.prototype, "httpEquiv", {configurable:true, enumerable:true, get: function (){return ldvm.toolsFunc.dispatch(this, HTMLMetaElement.prototype, "HTMLMetaElement", "httpEquiv_get", arguments)},set: function (){return ldvm.toolsFunc.dispatch(this, HTMLMetaElement.prototype, "HTMLMetaElement", "httpEquiv_set", arguments)}});
ldvm.toolsFunc.defineProperty(HTMLMetaElement.prototype, "content", {configurable:true, enumerable:true, get: function (){return ldvm.toolsFunc.dispatch(this, HTMLMetaElement.prototype, "HTMLMetaElement", "content_get", arguments)},set: function (){return ldvm.toolsFunc.dispatch(this, HTMLMetaElement.prototype, "HTMLMetaElement", "content_set", arguments)}});
ldvm.toolsFunc.defineProperty(HTMLMetaElement.prototype, "media", {configurable:true, enumerable:true, get: function (){return ldvm.toolsFunc.dispatch(this, HTMLMetaElement.prototype, "HTMLMetaElement", "media_get", arguments)},set: function (){return ldvm.toolsFunc.dispatch(this, HTMLMetaElement.prototype, "HTMLMetaElement", "media_set", arguments)}});
ldvm.toolsFunc.defineProperty(HTMLMetaElement.prototype, "scheme", {configurable:true, enumerable:true, get: function (){return ldvm.toolsFunc.dispatch(this, HTMLMetaElement.prototype, "HTMLMetaElement", "scheme_get", arguments)},set: function (){return ldvm.toolsFunc.dispatch(this, HTMLMetaElement.prototype, "HTMLMetaElement", "scheme_set", arguments)}});

// HTMLSpanElement对象
HTMLSpanElement = function HTMLSpanElement(){ldvm.toolsFunc.throwError("TypeError", "Failed to construct 'HTMLSpanElement': Illegal constructor")}
ldvm.toolsFunc.safeProto(HTMLSpanElement, "HTMLSpanElement");
Object.setPrototypeOf(HTMLSpanElement.prototype, HTMLElement.prototype);



// Document对象
Document = function Document(){}
ldvm.toolsFunc.safeProto(Document, "Document");
Object.setPrototypeOf(Document.prototype, Node.prototype);
ldvm.toolsFunc.defineProperty(Document.prototype, "createElement", {configurable:true, enumerable:true, writable:true, value: function (){return ldvm.toolsFunc.dispatch(this, Document.prototype, "Document", "createElement", arguments)}});




ldvm.toolsFunc.defineProperty(Document, "parseHTMLUnsafe", {configurable:true, enumerable:true, writable:true, value: function (){return ldvm.toolsFunc.dispatch(this, Document, "Document", "parseHTMLUnsafe", arguments)}});
ldvm.toolsFunc.defineProperty(Document, "parseHTML", {configurable:true, enumerable:true, writable:true, value: function (){return ldvm.toolsFunc.dispatch(this, Document, "Document", "parseHTML", arguments)}});
ldvm.toolsFunc.defineProperty(Document.prototype, "implementation", {configurable:true, enumerable:true, get: function (){return ldvm.toolsFunc.dispatch(this, Document.prototype, "Document", "implementation_get", arguments)},set:undefined});
ldvm.toolsFunc.defineProperty(Document.prototype, "URL", {configurable:true, enumerable:true, get: function (){return ldvm.toolsFunc.dispatch(this, Document.prototype, "Document", "URL_get", arguments)},set:undefined});
ldvm.toolsFunc.defineProperty(Document.prototype, "documentURI", {configurable:true, enumerable:true, get: function (){return ldvm.toolsFunc.dispatch(this, Document.prototype, "Document", "documentURI_get", arguments)},set:undefined});
ldvm.toolsFunc.defineProperty(Document.prototype, "compatMode", {configurable:true, enumerable:true, get: function (){return ldvm.toolsFunc.dispatch(this, Document.prototype, "Document", "compatMode_get", arguments)},set:undefined});
ldvm.toolsFunc.defineProperty(Document.prototype, "characterSet", {configurable:true, enumerable:true, get: function (){return ldvm.toolsFunc.dispatch(this, Document.prototype, "Document", "characterSet_get", arguments)},set:undefined});
ldvm.toolsFunc.defineProperty(Document.prototype, "charset", {configurable:true, enumerable:true, get: function (){return ldvm.toolsFunc.dispatch(this, Document.prototype, "Document", "charset_get", arguments)},set:undefined});
ldvm.toolsFunc.defineProperty(Document.prototype, "inputEncoding", {configurable:true, enumerable:true, get: function (){return ldvm.toolsFunc.dispatch(this, Document.prototype, "Document", "inputEncoding_get", arguments)},set:undefined});
ldvm.toolsFunc.defineProperty(Document.prototype, "contentType", {configurable:true, enumerable:true, get: function (){return ldvm.toolsFunc.dispatch(this, Document.prototype, "Document", "contentType_get", arguments)},set:undefined});
ldvm.toolsFunc.defineProperty(Document.prototype, "doctype", {configurable:true, enumerable:true, get: function (){return ldvm.toolsFunc.dispatch(this, Document.prototype, "Document", "doctype_get", arguments)},set:undefined});
ldvm.toolsFunc.defineProperty(Document.prototype, "documentElement", {configurable:true, enumerable:true, get: function (){return ldvm.toolsFunc.dispatch(this, Document.prototype, "Document", "documentElement_get", arguments)},set:undefined});
ldvm.toolsFunc.defineProperty(Document.prototype, "xmlEncoding", {configurable:true, enumerable:true, get: function (){return ldvm.toolsFunc.dispatch(this, Document.prototype, "Document", "xmlEncoding_get", arguments)},set:undefined});
ldvm.toolsFunc.defineProperty(Document.prototype, "xmlVersion", {configurable:true, enumerable:true, get: function (){return ldvm.toolsFunc.dispatch(this, Document.prototype, "Document", "xmlVersion_get", arguments)},set: function (){return ldvm.toolsFunc.dispatch(this, Document.prototype, "Document", "xmlVersion_set", arguments)}});
ldvm.toolsFunc.defineProperty(Document.prototype, "xmlStandalone", {configurable:true, enumerable:true, get: function (){return ldvm.toolsFunc.dispatch(this, Document.prototype, "Document", "xmlStandalone_get", arguments)},set: function (){return ldvm.toolsFunc.dispatch(this, Document.prototype, "Document", "xmlStandalone_set", arguments)}});
ldvm.toolsFunc.defineProperty(Document.prototype, "domain", {configurable:true, enumerable:true, get: function (){return ldvm.toolsFunc.dispatch(this, Document.prototype, "Document", "domain_get", arguments)},set: function (){return ldvm.toolsFunc.dispatch(this, Document.prototype, "Document", "domain_set", arguments)}});
ldvm.toolsFunc.defineProperty(Document.prototype, "referrer", {configurable:true, enumerable:true, get: function (){return ldvm.toolsFunc.dispatch(this, Document.prototype, "Document", "referrer_get", arguments)},set:undefined});
ldvm.toolsFunc.defineProperty(Document.prototype, "cookie", {configurable:true, enumerable:true, get: function (){return ldvm.toolsFunc.dispatch(this, Document.prototype, "Document", "cookie_get", arguments)},set: function (){return ldvm.toolsFunc.dispatch(this, Document.prototype, "Document", "cookie_set", arguments)}});
ldvm.toolsFunc.defineProperty(Document.prototype, "lastModified", {configurable:true, enumerable:true, get: function (){return ldvm.toolsFunc.dispatch(this, Document.prototype, "Document", "lastModified_get", arguments)},set:undefined});
ldvm.toolsFunc.defineProperty(Document.prototype, "readyState", {configurable:true, enumerable:true, get: function (){return ldvm.toolsFunc.dispatch(this, Document.prototype, "Document", "readyState_get", arguments)},set:undefined});
ldvm.toolsFunc.defineProperty(Document.prototype, "title", {configurable:true, enumerable:true, get: function (){return ldvm.toolsFunc.dispatch(this, Document.prototype, "Document", "title_get", arguments)},set: function (){return ldvm.toolsFunc.dispatch(this, Document.prototype, "Document", "title_set", arguments)}});
ldvm.toolsFunc.defineProperty(Document.prototype, "dir", {configurable:true, enumerable:true, get: function (){return ldvm.toolsFunc.dispatch(this, Document.prototype, "Document", "dir_get", arguments)},set: function (){return ldvm.toolsFunc.dispatch(this, Document.prototype, "Document", "dir_set", arguments)}});
ldvm.toolsFunc.defineProperty(Document.prototype, "body", {configurable:true, enumerable:true, get: function (){return ldvm.toolsFunc.dispatch(this, Document.prototype, "Document", "body_get", arguments)},set: function (){return ldvm.toolsFunc.dispatch(this, Document.prototype, "Document", "body_set", arguments)}});
ldvm.toolsFunc.defineProperty(Document.prototype, "head", {configurable:true, enumerable:true, get: function (){return ldvm.toolsFunc.dispatch(this, Document.prototype, "Document", "head_get", arguments)},set:undefined});
ldvm.toolsFunc.defineProperty(Document.prototype, "images", {configurable:true, enumerable:true, get: function (){return ldvm.toolsFunc.dispatch(this, Document.prototype, "Document", "images_get", arguments)},set:undefined});
ldvm.toolsFunc.defineProperty(Document.prototype, "embeds", {configurable:true, enumerable:true, get: function (){return ldvm.toolsFunc.dispatch(this, Document.prototype, "Document", "embeds_get", arguments)},set:undefined});
ldvm.toolsFunc.defineProperty(Document.prototype, "plugins", {configurable:true, enumerable:true, get: function (){return ldvm.toolsFunc.dispatch(this, Document.prototype, "Document", "plugins_get", arguments)},set:undefined});
ldvm.toolsFunc.defineProperty(Document.prototype, "links", {configurable:true, enumerable:true, get: function (){return ldvm.toolsFunc.dispatch(this, Document.prototype, "Document", "links_get", arguments)},set:undefined});
ldvm.toolsFunc.defineProperty(Document.prototype, "forms", {configurable:true, enumerable:true, get: function (){return ldvm.toolsFunc.dispatch(this, Document.prototype, "Document", "forms_get", arguments)},set:undefined});
ldvm.toolsFunc.defineProperty(Document.prototype, "scripts", {configurable:true, enumerable:true, get: function (){return ldvm.toolsFunc.dispatch(this, Document.prototype, "Document", "scripts_get", arguments)},set:undefined});
ldvm.toolsFunc.defineProperty(Document.prototype, "currentScript", {configurable:true, enumerable:true, get: function (){return ldvm.toolsFunc.dispatch(this, Document.prototype, "Document", "currentScript_get", arguments)},set:undefined});
ldvm.toolsFunc.defineProperty(Document.prototype, "defaultView", {configurable:true, enumerable:true, get: function (){return ldvm.toolsFunc.dispatch(this, Document.prototype, "Document", "defaultView_get", arguments)},set:undefined});
ldvm.toolsFunc.defineProperty(Document.prototype, "designMode", {configurable:true, enumerable:true, get: function (){return ldvm.toolsFunc.dispatch(this, Document.prototype, "Document", "designMode_get", arguments)},set: function (){return ldvm.toolsFunc.dispatch(this, Document.prototype, "Document", "designMode_set", arguments)}});
ldvm.toolsFunc.defineProperty(Document.prototype, "onreadystatechange", {configurable:true, enumerable:true, get: function (){return ldvm.toolsFunc.dispatch(this, Document.prototype, "Document", "onreadystatechange_get", arguments)},set: function (){return ldvm.toolsFunc.dispatch(this, Document.prototype, "Document", "onreadystatechange_set", arguments)}});
ldvm.toolsFunc.defineProperty(Document.prototype, "anchors", {configurable:true, enumerable:true, get: function (){return ldvm.toolsFunc.dispatch(this, Document.prototype, "Document", "anchors_get", arguments)},set:undefined});
ldvm.toolsFunc.defineProperty(Document.prototype, "applets", {configurable:true, enumerable:true, get: function (){return ldvm.toolsFunc.dispatch(this, Document.prototype, "Document", "applets_get", arguments)},set:undefined});
ldvm.toolsFunc.defineProperty(Document.prototype, "fgColor", {configurable:true, enumerable:true, get: function (){return ldvm.toolsFunc.dispatch(this, Document.prototype, "Document", "fgColor_get", arguments)},set: function (){return ldvm.toolsFunc.dispatch(this, Document.prototype, "Document", "fgColor_set", arguments)}});
ldvm.toolsFunc.defineProperty(Document.prototype, "linkColor", {configurable:true, enumerable:true, get: function (){return ldvm.toolsFunc.dispatch(this, Document.prototype, "Document", "linkColor_get", arguments)},set: function (){return ldvm.toolsFunc.dispatch(this, Document.prototype, "Document", "linkColor_set", arguments)}});
ldvm.toolsFunc.defineProperty(Document.prototype, "vlinkColor", {configurable:true, enumerable:true, get: function (){return ldvm.toolsFunc.dispatch(this, Document.prototype, "Document", "vlinkColor_get", arguments)},set: function (){return ldvm.toolsFunc.dispatch(this, Document.prototype, "Document", "vlinkColor_set", arguments)}});
ldvm.toolsFunc.defineProperty(Document.prototype, "alinkColor", {configurable:true, enumerable:true, get: function (){return ldvm.toolsFunc.dispatch(this, Document.prototype, "Document", "alinkColor_get", arguments)},set: function (){return ldvm.toolsFunc.dispatch(this, Document.prototype, "Document", "alinkColor_set", arguments)}});
ldvm.toolsFunc.defineProperty(Document.prototype, "bgColor", {configurable:true, enumerable:true, get: function (){return ldvm.toolsFunc.dispatch(this, Document.prototype, "Document", "bgColor_get", arguments)},set: function (){return ldvm.toolsFunc.dispatch(this, Document.prototype, "Document", "bgColor_set", arguments)}});
ldvm.toolsFunc.defineProperty(Document.prototype, "all", {configurable:true, enumerable:true, get: function (){return ldvm.toolsFunc.dispatch(this, Document.prototype, "Document", "all_get", arguments)},set:undefined});
ldvm.toolsFunc.defineProperty(Document.prototype, "scrollingElement", {configurable:true, enumerable:true, get: function (){return ldvm.toolsFunc.dispatch(this, Document.prototype, "Document", "scrollingElement_get", arguments)},set:undefined});
ldvm.toolsFunc.defineProperty(Document.prototype, "onpointerlockchange", {configurable:true, enumerable:true, get: function (){return ldvm.toolsFunc.dispatch(this, Document.prototype, "Document", "onpointerlockchange_get", arguments)},set: function (){return ldvm.toolsFunc.dispatch(this, Document.prototype, "Document", "onpointerlockchange_set", arguments)}});
ldvm.toolsFunc.defineProperty(Document.prototype, "onpointerlockerror", {configurable:true, enumerable:true, get: function (){return ldvm.toolsFunc.dispatch(this, Document.prototype, "Document", "onpointerlockerror_get", arguments)},set: function (){return ldvm.toolsFunc.dispatch(this, Document.prototype, "Document", "onpointerlockerror_set", arguments)}});
ldvm.toolsFunc.defineProperty(Document.prototype, "hidden", {configurable:true, enumerable:true, get: function (){return ldvm.toolsFunc.dispatch(this, Document.prototype, "Document", "hidden_get", arguments)},set:undefined});
ldvm.toolsFunc.defineProperty(Document.prototype, "visibilityState", {configurable:true, enumerable:true, get: function (){return ldvm.toolsFunc.dispatch(this, Document.prototype, "Document", "visibilityState_get", arguments)},set:undefined});
ldvm.toolsFunc.defineProperty(Document.prototype, "wasDiscarded", {configurable:true, enumerable:true, get: function (){return ldvm.toolsFunc.dispatch(this, Document.prototype, "Document", "wasDiscarded_get", arguments)},set:undefined});
ldvm.toolsFunc.defineProperty(Document.prototype, "prerendering", {configurable:true, enumerable:true, get: function (){return ldvm.toolsFunc.dispatch(this, Document.prototype, "Document", "prerendering_get", arguments)},set:undefined});
ldvm.toolsFunc.defineProperty(Document.prototype, "featurePolicy", {configurable:true, enumerable:true, get: function (){return ldvm.toolsFunc.dispatch(this, Document.prototype, "Document", "featurePolicy_get", arguments)},set:undefined});
ldvm.toolsFunc.defineProperty(Document.prototype, "webkitVisibilityState", {configurable:true, enumerable:true, get: function (){return ldvm.toolsFunc.dispatch(this, Document.prototype, "Document", "webkitVisibilityState_get", arguments)},set:undefined});
ldvm.toolsFunc.defineProperty(Document.prototype, "webkitHidden", {configurable:true, enumerable:true, get: function (){return ldvm.toolsFunc.dispatch(this, Document.prototype, "Document", "webkitHidden_get", arguments)},set:undefined});
ldvm.toolsFunc.defineProperty(Document.prototype, "onbeforecopy", {configurable:true, enumerable:true, get: function (){return ldvm.toolsFunc.dispatch(this, Document.prototype, "Document", "onbeforecopy_get", arguments)},set: function (){return ldvm.toolsFunc.dispatch(this, Document.prototype, "Document", "onbeforecopy_set", arguments)}});
ldvm.toolsFunc.defineProperty(Document.prototype, "onbeforecut", {configurable:true, enumerable:true, get: function (){return ldvm.toolsFunc.dispatch(this, Document.prototype, "Document", "onbeforecut_get", arguments)},set: function (){return ldvm.toolsFunc.dispatch(this, Document.prototype, "Document", "onbeforecut_set", arguments)}});
ldvm.toolsFunc.defineProperty(Document.prototype, "onbeforepaste", {configurable:true, enumerable:true, get: function (){return ldvm.toolsFunc.dispatch(this, Document.prototype, "Document", "onbeforepaste_get", arguments)},set: function (){return ldvm.toolsFunc.dispatch(this, Document.prototype, "Document", "onbeforepaste_set", arguments)}});
ldvm.toolsFunc.defineProperty(Document.prototype, "onfreeze", {configurable:true, enumerable:true, get: function (){return ldvm.toolsFunc.dispatch(this, Document.prototype, "Document", "onfreeze_get", arguments)},set: function (){return ldvm.toolsFunc.dispatch(this, Document.prototype, "Document", "onfreeze_set", arguments)}});
ldvm.toolsFunc.defineProperty(Document.prototype, "onprerenderingchange", {configurable:true, enumerable:true, get: function (){return ldvm.toolsFunc.dispatch(this, Document.prototype, "Document", "onprerenderingchange_get", arguments)},set: function (){return ldvm.toolsFunc.dispatch(this, Document.prototype, "Document", "onprerenderingchange_set", arguments)}});
ldvm.toolsFunc.defineProperty(Document.prototype, "onresume", {configurable:true, enumerable:true, get: function (){return ldvm.toolsFunc.dispatch(this, Document.prototype, "Document", "onresume_get", arguments)},set: function (){return ldvm.toolsFunc.dispatch(this, Document.prototype, "Document", "onresume_set", arguments)}});
ldvm.toolsFunc.defineProperty(Document.prototype, "onsearch", {configurable:true, enumerable:true, get: function (){return ldvm.toolsFunc.dispatch(this, Document.prototype, "Document", "onsearch_get", arguments)},set: function (){return ldvm.toolsFunc.dispatch(this, Document.prototype, "Document", "onsearch_set", arguments)}});
ldvm.toolsFunc.defineProperty(Document.prototype, "onvisibilitychange", {configurable:true, enumerable:true, get: function (){return ldvm.toolsFunc.dispatch(this, Document.prototype, "Document", "onvisibilitychange_get", arguments)},set: function (){return ldvm.toolsFunc.dispatch(this, Document.prototype, "Document", "onvisibilitychange_set", arguments)}});
ldvm.toolsFunc.defineProperty(Document.prototype, "timeline", {configurable:true, enumerable:true, get: function (){return ldvm.toolsFunc.dispatch(this, Document.prototype, "Document", "timeline_get", arguments)},set:undefined});
ldvm.toolsFunc.defineProperty(Document.prototype, "fullscreenEnabled", {configurable:true, enumerable:true, get: function (){return ldvm.toolsFunc.dispatch(this, Document.prototype, "Document", "fullscreenEnabled_get", arguments)},set: function (){return ldvm.toolsFunc.dispatch(this, Document.prototype, "Document", "fullscreenEnabled_set", arguments)}});
ldvm.toolsFunc.defineProperty(Document.prototype, "fullscreen", {configurable:true, enumerable:true, get: function (){return ldvm.toolsFunc.dispatch(this, Document.prototype, "Document", "fullscreen_get", arguments)},set: function (){return ldvm.toolsFunc.dispatch(this, Document.prototype, "Document", "fullscreen_set", arguments)}});
ldvm.toolsFunc.defineProperty(Document.prototype, "onfullscreenchange", {configurable:true, enumerable:true, get: function (){return ldvm.toolsFunc.dispatch(this, Document.prototype, "Document", "onfullscreenchange_get", arguments)},set: function (){return ldvm.toolsFunc.dispatch(this, Document.prototype, "Document", "onfullscreenchange_set", arguments)}});
ldvm.toolsFunc.defineProperty(Document.prototype, "onfullscreenerror", {configurable:true, enumerable:true, get: function (){return ldvm.toolsFunc.dispatch(this, Document.prototype, "Document", "onfullscreenerror_get", arguments)},set: function (){return ldvm.toolsFunc.dispatch(this, Document.prototype, "Document", "onfullscreenerror_set", arguments)}});
ldvm.toolsFunc.defineProperty(Document.prototype, "webkitIsFullScreen", {configurable:true, enumerable:true, get: function (){return ldvm.toolsFunc.dispatch(this, Document.prototype, "Document", "webkitIsFullScreen_get", arguments)},set:undefined});
ldvm.toolsFunc.defineProperty(Document.prototype, "webkitCurrentFullScreenElement", {configurable:true, enumerable:true, get: function (){return ldvm.toolsFunc.dispatch(this, Document.prototype, "Document", "webkitCurrentFullScreenElement_get", arguments)},set:undefined});
ldvm.toolsFunc.defineProperty(Document.prototype, "webkitFullscreenEnabled", {configurable:true, enumerable:true, get: function (){return ldvm.toolsFunc.dispatch(this, Document.prototype, "Document", "webkitFullscreenEnabled_get", arguments)},set:undefined});
ldvm.toolsFunc.defineProperty(Document.prototype, "webkitFullscreenElement", {configurable:true, enumerable:true, get: function (){return ldvm.toolsFunc.dispatch(this, Document.prototype, "Document", "webkitFullscreenElement_get", arguments)},set:undefined});
ldvm.toolsFunc.defineProperty(Document.prototype, "onwebkitfullscreenchange", {configurable:true, enumerable:true, get: function (){return ldvm.toolsFunc.dispatch(this, Document.prototype, "Document", "onwebkitfullscreenchange_get", arguments)},set: function (){return ldvm.toolsFunc.dispatch(this, Document.prototype, "Document", "onwebkitfullscreenchange_set", arguments)}});
ldvm.toolsFunc.defineProperty(Document.prototype, "onwebkitfullscreenerror", {configurable:true, enumerable:true, get: function (){return ldvm.toolsFunc.dispatch(this, Document.prototype, "Document", "onwebkitfullscreenerror_get", arguments)},set: function (){return ldvm.toolsFunc.dispatch(this, Document.prototype, "Document", "onwebkitfullscreenerror_set", arguments)}});
ldvm.toolsFunc.defineProperty(Document.prototype, "rootElement", {configurable:true, enumerable:true, get: function (){return ldvm.toolsFunc.dispatch(this, Document.prototype, "Document", "rootElement_get", arguments)},set:undefined});
ldvm.toolsFunc.defineProperty(Document.prototype, "pictureInPictureEnabled", {configurable:true, enumerable:true, get: function (){return ldvm.toolsFunc.dispatch(this, Document.prototype, "Document", "pictureInPictureEnabled_get", arguments)},set:undefined});
ldvm.toolsFunc.defineProperty(Document.prototype, "onabort", {configurable:true, enumerable:true, get: function (){return ldvm.toolsFunc.dispatch(this, Document.prototype, "Document", "onabort_get", arguments)},set: function (){return ldvm.toolsFunc.dispatch(this, Document.prototype, "Document", "onabort_set", arguments)}});
ldvm.toolsFunc.defineProperty(Document.prototype, "onbeforeinput", {configurable:true, enumerable:true, get: function (){return ldvm.toolsFunc.dispatch(this, Document.prototype, "Document", "onbeforeinput_get", arguments)},set: function (){return ldvm.toolsFunc.dispatch(this, Document.prototype, "Document", "onbeforeinput_set", arguments)}});
ldvm.toolsFunc.defineProperty(Document.prototype, "onbeforematch", {configurable:true, enumerable:true, get: function (){return ldvm.toolsFunc.dispatch(this, Document.prototype, "Document", "onbeforematch_get", arguments)},set: function (){return ldvm.toolsFunc.dispatch(this, Document.prototype, "Document", "onbeforematch_set", arguments)}});
ldvm.toolsFunc.defineProperty(Document.prototype, "onbeforetoggle", {configurable:true, enumerable:true, get: function (){return ldvm.toolsFunc.dispatch(this, Document.prototype, "Document", "onbeforetoggle_get", arguments)},set: function (){return ldvm.toolsFunc.dispatch(this, Document.prototype, "Document", "onbeforetoggle_set", arguments)}});
ldvm.toolsFunc.defineProperty(Document.prototype, "onblur", {configurable:true, enumerable:true, get: function (){return ldvm.toolsFunc.dispatch(this, Document.prototype, "Document", "onblur_get", arguments)},set: function (){return ldvm.toolsFunc.dispatch(this, Document.prototype, "Document", "onblur_set", arguments)}});
ldvm.toolsFunc.defineProperty(Document.prototype, "oncancel", {configurable:true, enumerable:true, get: function (){return ldvm.toolsFunc.dispatch(this, Document.prototype, "Document", "oncancel_get", arguments)},set: function (){return ldvm.toolsFunc.dispatch(this, Document.prototype, "Document", "oncancel_set", arguments)}});
ldvm.toolsFunc.defineProperty(Document.prototype, "oncanplay", {configurable:true, enumerable:true, get: function (){return ldvm.toolsFunc.dispatch(this, Document.prototype, "Document", "oncanplay_get", arguments)},set: function (){return ldvm.toolsFunc.dispatch(this, Document.prototype, "Document", "oncanplay_set", arguments)}});
ldvm.toolsFunc.defineProperty(Document.prototype, "oncanplaythrough", {configurable:true, enumerable:true, get: function (){return ldvm.toolsFunc.dispatch(this, Document.prototype, "Document", "oncanplaythrough_get", arguments)},set: function (){return ldvm.toolsFunc.dispatch(this, Document.prototype, "Document", "oncanplaythrough_set", arguments)}});
ldvm.toolsFunc.defineProperty(Document.prototype, "onchange", {configurable:true, enumerable:true, get: function (){return ldvm.toolsFunc.dispatch(this, Document.prototype, "Document", "onchange_get", arguments)},set: function (){return ldvm.toolsFunc.dispatch(this, Document.prototype, "Document", "onchange_set", arguments)}});
ldvm.toolsFunc.defineProperty(Document.prototype, "onclick", {configurable:true, enumerable:true, get: function (){return ldvm.toolsFunc.dispatch(this, Document.prototype, "Document", "onclick_get", arguments)},set: function (){return ldvm.toolsFunc.dispatch(this, Document.prototype, "Document", "onclick_set", arguments)}});
ldvm.toolsFunc.defineProperty(Document.prototype, "onclose", {configurable:true, enumerable:true, get: function (){return ldvm.toolsFunc.dispatch(this, Document.prototype, "Document", "onclose_get", arguments)},set: function (){return ldvm.toolsFunc.dispatch(this, Document.prototype, "Document", "onclose_set", arguments)}});
ldvm.toolsFunc.defineProperty(Document.prototype, "oncommand", {configurable:true, enumerable:true, get: function (){return ldvm.toolsFunc.dispatch(this, Document.prototype, "Document", "oncommand_get", arguments)},set: function (){return ldvm.toolsFunc.dispatch(this, Document.prototype, "Document", "oncommand_set", arguments)}});
ldvm.toolsFunc.defineProperty(Document.prototype, "oncontentvisibilityautostatechange", {configurable:true, enumerable:true, get: function (){return ldvm.toolsFunc.dispatch(this, Document.prototype, "Document", "oncontentvisibilityautostatechange_get", arguments)},set: function (){return ldvm.toolsFunc.dispatch(this, Document.prototype, "Document", "oncontentvisibilityautostatechange_set", arguments)}});
ldvm.toolsFunc.defineProperty(Document.prototype, "oncontextlost", {configurable:true, enumerable:true, get: function (){return ldvm.toolsFunc.dispatch(this, Document.prototype, "Document", "oncontextlost_get", arguments)},set: function (){return ldvm.toolsFunc.dispatch(this, Document.prototype, "Document", "oncontextlost_set", arguments)}});
ldvm.toolsFunc.defineProperty(Document.prototype, "oncontextmenu", {configurable:true, enumerable:true, get: function (){return ldvm.toolsFunc.dispatch(this, Document.prototype, "Document", "oncontextmenu_get", arguments)},set: function (){return ldvm.toolsFunc.dispatch(this, Document.prototype, "Document", "oncontextmenu_set", arguments)}});
ldvm.toolsFunc.defineProperty(Document.prototype, "oncontextrestored", {configurable:true, enumerable:true, get: function (){return ldvm.toolsFunc.dispatch(this, Document.prototype, "Document", "oncontextrestored_get", arguments)},set: function (){return ldvm.toolsFunc.dispatch(this, Document.prototype, "Document", "oncontextrestored_set", arguments)}});
ldvm.toolsFunc.defineProperty(Document.prototype, "oncuechange", {configurable:true, enumerable:true, get: function (){return ldvm.toolsFunc.dispatch(this, Document.prototype, "Document", "oncuechange_get", arguments)},set: function (){return ldvm.toolsFunc.dispatch(this, Document.prototype, "Document", "oncuechange_set", arguments)}});
ldvm.toolsFunc.defineProperty(Document.prototype, "ondblclick", {configurable:true, enumerable:true, get: function (){return ldvm.toolsFunc.dispatch(this, Document.prototype, "Document", "ondblclick_get", arguments)},set: function (){return ldvm.toolsFunc.dispatch(this, Document.prototype, "Document", "ondblclick_set", arguments)}});
ldvm.toolsFunc.defineProperty(Document.prototype, "ondrag", {configurable:true, enumerable:true, get: function (){return ldvm.toolsFunc.dispatch(this, Document.prototype, "Document", "ondrag_get", arguments)},set: function (){return ldvm.toolsFunc.dispatch(this, Document.prototype, "Document", "ondrag_set", arguments)}});
ldvm.toolsFunc.defineProperty(Document.prototype, "ondragend", {configurable:true, enumerable:true, get: function (){return ldvm.toolsFunc.dispatch(this, Document.prototype, "Document", "ondragend_get", arguments)},set: function (){return ldvm.toolsFunc.dispatch(this, Document.prototype, "Document", "ondragend_set", arguments)}});
ldvm.toolsFunc.defineProperty(Document.prototype, "ondragenter", {configurable:true, enumerable:true, get: function (){return ldvm.toolsFunc.dispatch(this, Document.prototype, "Document", "ondragenter_get", arguments)},set: function (){return ldvm.toolsFunc.dispatch(this, Document.prototype, "Document", "ondragenter_set", arguments)}});
ldvm.toolsFunc.defineProperty(Document.prototype, "ondragleave", {configurable:true, enumerable:true, get: function (){return ldvm.toolsFunc.dispatch(this, Document.prototype, "Document", "ondragleave_get", arguments)},set: function (){return ldvm.toolsFunc.dispatch(this, Document.prototype, "Document", "ondragleave_set", arguments)}});
ldvm.toolsFunc.defineProperty(Document.prototype, "ondragover", {configurable:true, enumerable:true, get: function (){return ldvm.toolsFunc.dispatch(this, Document.prototype, "Document", "ondragover_get", arguments)},set: function (){return ldvm.toolsFunc.dispatch(this, Document.prototype, "Document", "ondragover_set", arguments)}});
ldvm.toolsFunc.defineProperty(Document.prototype, "ondragstart", {configurable:true, enumerable:true, get: function (){return ldvm.toolsFunc.dispatch(this, Document.prototype, "Document", "ondragstart_get", arguments)},set: function (){return ldvm.toolsFunc.dispatch(this, Document.prototype, "Document", "ondragstart_set", arguments)}});
ldvm.toolsFunc.defineProperty(Document.prototype, "ondrop", {configurable:true, enumerable:true, get: function (){return ldvm.toolsFunc.dispatch(this, Document.prototype, "Document", "ondrop_get", arguments)},set: function (){return ldvm.toolsFunc.dispatch(this, Document.prototype, "Document", "ondrop_set", arguments)}});
ldvm.toolsFunc.defineProperty(Document.prototype, "ondurationchange", {configurable:true, enumerable:true, get: function (){return ldvm.toolsFunc.dispatch(this, Document.prototype, "Document", "ondurationchange_get", arguments)},set: function (){return ldvm.toolsFunc.dispatch(this, Document.prototype, "Document", "ondurationchange_set", arguments)}});
ldvm.toolsFunc.defineProperty(Document.prototype, "onemptied", {configurable:true, enumerable:true, get: function (){return ldvm.toolsFunc.dispatch(this, Document.prototype, "Document", "onemptied_get", arguments)},set: function (){return ldvm.toolsFunc.dispatch(this, Document.prototype, "Document", "onemptied_set", arguments)}});
ldvm.toolsFunc.defineProperty(Document.prototype, "onended", {configurable:true, enumerable:true, get: function (){return ldvm.toolsFunc.dispatch(this, Document.prototype, "Document", "onended_get", arguments)},set: function (){return ldvm.toolsFunc.dispatch(this, Document.prototype, "Document", "onended_set", arguments)}});
ldvm.toolsFunc.defineProperty(Document.prototype, "onerror", {configurable:true, enumerable:true, get: function (){return ldvm.toolsFunc.dispatch(this, Document.prototype, "Document", "onerror_get", arguments)},set: function (){return ldvm.toolsFunc.dispatch(this, Document.prototype, "Document", "onerror_set", arguments)}});
ldvm.toolsFunc.defineProperty(Document.prototype, "onfocus", {configurable:true, enumerable:true, get: function (){return ldvm.toolsFunc.dispatch(this, Document.prototype, "Document", "onfocus_get", arguments)},set: function (){return ldvm.toolsFunc.dispatch(this, Document.prototype, "Document", "onfocus_set", arguments)}});
ldvm.toolsFunc.defineProperty(Document.prototype, "onformdata", {configurable:true, enumerable:true, get: function (){return ldvm.toolsFunc.dispatch(this, Document.prototype, "Document", "onformdata_get", arguments)},set: function (){return ldvm.toolsFunc.dispatch(this, Document.prototype, "Document", "onformdata_set", arguments)}});
ldvm.toolsFunc.defineProperty(Document.prototype, "oninput", {configurable:true, enumerable:true, get: function (){return ldvm.toolsFunc.dispatch(this, Document.prototype, "Document", "oninput_get", arguments)},set: function (){return ldvm.toolsFunc.dispatch(this, Document.prototype, "Document", "oninput_set", arguments)}});
ldvm.toolsFunc.defineProperty(Document.prototype, "oninvalid", {configurable:true, enumerable:true, get: function (){return ldvm.toolsFunc.dispatch(this, Document.prototype, "Document", "oninvalid_get", arguments)},set: function (){return ldvm.toolsFunc.dispatch(this, Document.prototype, "Document", "oninvalid_set", arguments)}});
ldvm.toolsFunc.defineProperty(Document.prototype, "onkeydown", {configurable:true, enumerable:true, get: function (){return ldvm.toolsFunc.dispatch(this, Document.prototype, "Document", "onkeydown_get", arguments)},set: function (){return ldvm.toolsFunc.dispatch(this, Document.prototype, "Document", "onkeydown_set", arguments)}});
ldvm.toolsFunc.defineProperty(Document.prototype, "onkeypress", {configurable:true, enumerable:true, get: function (){return ldvm.toolsFunc.dispatch(this, Document.prototype, "Document", "onkeypress_get", arguments)},set: function (){return ldvm.toolsFunc.dispatch(this, Document.prototype, "Document", "onkeypress_set", arguments)}});
ldvm.toolsFunc.defineProperty(Document.prototype, "onkeyup", {configurable:true, enumerable:true, get: function (){return ldvm.toolsFunc.dispatch(this, Document.prototype, "Document", "onkeyup_get", arguments)},set: function (){return ldvm.toolsFunc.dispatch(this, Document.prototype, "Document", "onkeyup_set", arguments)}});
ldvm.toolsFunc.defineProperty(Document.prototype, "onload", {configurable:true, enumerable:true, get: function (){return ldvm.toolsFunc.dispatch(this, Document.prototype, "Document", "onload_get", arguments)},set: function (){return ldvm.toolsFunc.dispatch(this, Document.prototype, "Document", "onload_set", arguments)}});
ldvm.toolsFunc.defineProperty(Document.prototype, "onloadeddata", {configurable:true, enumerable:true, get: function (){return ldvm.toolsFunc.dispatch(this, Document.prototype, "Document", "onloadeddata_get", arguments)},set: function (){return ldvm.toolsFunc.dispatch(this, Document.prototype, "Document", "onloadeddata_set", arguments)}});
ldvm.toolsFunc.defineProperty(Document.prototype, "onloadedmetadata", {configurable:true, enumerable:true, get: function (){return ldvm.toolsFunc.dispatch(this, Document.prototype, "Document", "onloadedmetadata_get", arguments)},set: function (){return ldvm.toolsFunc.dispatch(this, Document.prototype, "Document", "onloadedmetadata_set", arguments)}});
ldvm.toolsFunc.defineProperty(Document.prototype, "onloadstart", {configurable:true, enumerable:true, get: function (){return ldvm.toolsFunc.dispatch(this, Document.prototype, "Document", "onloadstart_get", arguments)},set: function (){return ldvm.toolsFunc.dispatch(this, Document.prototype, "Document", "onloadstart_set", arguments)}});
ldvm.toolsFunc.defineProperty(Document.prototype, "onmousedown", {configurable:true, enumerable:true, get: function (){return ldvm.toolsFunc.dispatch(this, Document.prototype, "Document", "onmousedown_get", arguments)},set: function (){return ldvm.toolsFunc.dispatch(this, Document.prototype, "Document", "onmousedown_set", arguments)}});
ldvm.toolsFunc.defineProperty(Document.prototype, "onmouseenter", {configurable:true, enumerable:true, get: function (){return ldvm.toolsFunc.dispatch(this, Document.prototype, "Document", "onmouseenter_get", arguments)},set: function (){return ldvm.toolsFunc.dispatch(this, Document.prototype, "Document", "onmouseenter_set", arguments)}});
ldvm.toolsFunc.defineProperty(Document.prototype, "onmouseleave", {configurable:true, enumerable:true, get: function (){return ldvm.toolsFunc.dispatch(this, Document.prototype, "Document", "onmouseleave_get", arguments)},set: function (){return ldvm.toolsFunc.dispatch(this, Document.prototype, "Document", "onmouseleave_set", arguments)}});
ldvm.toolsFunc.defineProperty(Document.prototype, "onmousemove", {configurable:true, enumerable:true, get: function (){return ldvm.toolsFunc.dispatch(this, Document.prototype, "Document", "onmousemove_get", arguments)},set: function (){return ldvm.toolsFunc.dispatch(this, Document.prototype, "Document", "onmousemove_set", arguments)}});
ldvm.toolsFunc.defineProperty(Document.prototype, "onmouseout", {configurable:true, enumerable:true, get: function (){return ldvm.toolsFunc.dispatch(this, Document.prototype, "Document", "onmouseout_get", arguments)},set: function (){return ldvm.toolsFunc.dispatch(this, Document.prototype, "Document", "onmouseout_set", arguments)}});
ldvm.toolsFunc.defineProperty(Document.prototype, "onmouseover", {configurable:true, enumerable:true, get: function (){return ldvm.toolsFunc.dispatch(this, Document.prototype, "Document", "onmouseover_get", arguments)},set: function (){return ldvm.toolsFunc.dispatch(this, Document.prototype, "Document", "onmouseover_set", arguments)}});
ldvm.toolsFunc.defineProperty(Document.prototype, "onmouseup", {configurable:true, enumerable:true, get: function (){return ldvm.toolsFunc.dispatch(this, Document.prototype, "Document", "onmouseup_get", arguments)},set: function (){return ldvm.toolsFunc.dispatch(this, Document.prototype, "Document", "onmouseup_set", arguments)}});
ldvm.toolsFunc.defineProperty(Document.prototype, "onmousewheel", {configurable:true, enumerable:true, get: function (){return ldvm.toolsFunc.dispatch(this, Document.prototype, "Document", "onmousewheel_get", arguments)},set: function (){return ldvm.toolsFunc.dispatch(this, Document.prototype, "Document", "onmousewheel_set", arguments)}});
ldvm.toolsFunc.defineProperty(Document.prototype, "onpause", {configurable:true, enumerable:true, get: function (){return ldvm.toolsFunc.dispatch(this, Document.prototype, "Document", "onpause_get", arguments)},set: function (){return ldvm.toolsFunc.dispatch(this, Document.prototype, "Document", "onpause_set", arguments)}});
ldvm.toolsFunc.defineProperty(Document.prototype, "onplay", {configurable:true, enumerable:true, get: function (){return ldvm.toolsFunc.dispatch(this, Document.prototype, "Document", "onplay_get", arguments)},set: function (){return ldvm.toolsFunc.dispatch(this, Document.prototype, "Document", "onplay_set", arguments)}});
ldvm.toolsFunc.defineProperty(Document.prototype, "onplaying", {configurable:true, enumerable:true, get: function (){return ldvm.toolsFunc.dispatch(this, Document.prototype, "Document", "onplaying_get", arguments)},set: function (){return ldvm.toolsFunc.dispatch(this, Document.prototype, "Document", "onplaying_set", arguments)}});
ldvm.toolsFunc.defineProperty(Document.prototype, "onprogress", {configurable:true, enumerable:true, get: function (){return ldvm.toolsFunc.dispatch(this, Document.prototype, "Document", "onprogress_get", arguments)},set: function (){return ldvm.toolsFunc.dispatch(this, Document.prototype, "Document", "onprogress_set", arguments)}});
ldvm.toolsFunc.defineProperty(Document.prototype, "onratechange", {configurable:true, enumerable:true, get: function (){return ldvm.toolsFunc.dispatch(this, Document.prototype, "Document", "onratechange_get", arguments)},set: function (){return ldvm.toolsFunc.dispatch(this, Document.prototype, "Document", "onratechange_set", arguments)}});
ldvm.toolsFunc.defineProperty(Document.prototype, "onreset", {configurable:true, enumerable:true, get: function (){return ldvm.toolsFunc.dispatch(this, Document.prototype, "Document", "onreset_get", arguments)},set: function (){return ldvm.toolsFunc.dispatch(this, Document.prototype, "Document", "onreset_set", arguments)}});
ldvm.toolsFunc.defineProperty(Document.prototype, "onresize", {configurable:true, enumerable:true, get: function (){return ldvm.toolsFunc.dispatch(this, Document.prototype, "Document", "onresize_get", arguments)},set: function (){return ldvm.toolsFunc.dispatch(this, Document.prototype, "Document", "onresize_set", arguments)}});
ldvm.toolsFunc.defineProperty(Document.prototype, "onscroll", {configurable:true, enumerable:true, get: function (){return ldvm.toolsFunc.dispatch(this, Document.prototype, "Document", "onscroll_get", arguments)},set: function (){return ldvm.toolsFunc.dispatch(this, Document.prototype, "Document", "onscroll_set", arguments)}});
ldvm.toolsFunc.defineProperty(Document.prototype, "onscrollend", {configurable:true, enumerable:true, get: function (){return ldvm.toolsFunc.dispatch(this, Document.prototype, "Document", "onscrollend_get", arguments)},set: function (){return ldvm.toolsFunc.dispatch(this, Document.prototype, "Document", "onscrollend_set", arguments)}});
ldvm.toolsFunc.defineProperty(Document.prototype, "onsecuritypolicyviolation", {configurable:true, enumerable:true, get: function (){return ldvm.toolsFunc.dispatch(this, Document.prototype, "Document", "onsecuritypolicyviolation_get", arguments)},set: function (){return ldvm.toolsFunc.dispatch(this, Document.prototype, "Document", "onsecuritypolicyviolation_set", arguments)}});
ldvm.toolsFunc.defineProperty(Document.prototype, "onseeked", {configurable:true, enumerable:true, get: function (){return ldvm.toolsFunc.dispatch(this, Document.prototype, "Document", "onseeked_get", arguments)},set: function (){return ldvm.toolsFunc.dispatch(this, Document.prototype, "Document", "onseeked_set", arguments)}});
ldvm.toolsFunc.defineProperty(Document.prototype, "onseeking", {configurable:true, enumerable:true, get: function (){return ldvm.toolsFunc.dispatch(this, Document.prototype, "Document", "onseeking_get", arguments)},set: function (){return ldvm.toolsFunc.dispatch(this, Document.prototype, "Document", "onseeking_set", arguments)}});
ldvm.toolsFunc.defineProperty(Document.prototype, "onselect", {configurable:true, enumerable:true, get: function (){return ldvm.toolsFunc.dispatch(this, Document.prototype, "Document", "onselect_get", arguments)},set: function (){return ldvm.toolsFunc.dispatch(this, Document.prototype, "Document", "onselect_set", arguments)}});
ldvm.toolsFunc.defineProperty(Document.prototype, "onslotchange", {configurable:true, enumerable:true, get: function (){return ldvm.toolsFunc.dispatch(this, Document.prototype, "Document", "onslotchange_get", arguments)},set: function (){return ldvm.toolsFunc.dispatch(this, Document.prototype, "Document", "onslotchange_set", arguments)}});
ldvm.toolsFunc.defineProperty(Document.prototype, "onstalled", {configurable:true, enumerable:true, get: function (){return ldvm.toolsFunc.dispatch(this, Document.prototype, "Document", "onstalled_get", arguments)},set: function (){return ldvm.toolsFunc.dispatch(this, Document.prototype, "Document", "onstalled_set", arguments)}});
ldvm.toolsFunc.defineProperty(Document.prototype, "onsubmit", {configurable:true, enumerable:true, get: function (){return ldvm.toolsFunc.dispatch(this, Document.prototype, "Document", "onsubmit_get", arguments)},set: function (){return ldvm.toolsFunc.dispatch(this, Document.prototype, "Document", "onsubmit_set", arguments)}});
ldvm.toolsFunc.defineProperty(Document.prototype, "onsuspend", {configurable:true, enumerable:true, get: function (){return ldvm.toolsFunc.dispatch(this, Document.prototype, "Document", "onsuspend_get", arguments)},set: function (){return ldvm.toolsFunc.dispatch(this, Document.prototype, "Document", "onsuspend_set", arguments)}});
ldvm.toolsFunc.defineProperty(Document.prototype, "ontimeupdate", {configurable:true, enumerable:true, get: function (){return ldvm.toolsFunc.dispatch(this, Document.prototype, "Document", "ontimeupdate_get", arguments)},set: function (){return ldvm.toolsFunc.dispatch(this, Document.prototype, "Document", "ontimeupdate_set", arguments)}});
ldvm.toolsFunc.defineProperty(Document.prototype, "ontoggle", {configurable:true, enumerable:true, get: function (){return ldvm.toolsFunc.dispatch(this, Document.prototype, "Document", "ontoggle_get", arguments)},set: function (){return ldvm.toolsFunc.dispatch(this, Document.prototype, "Document", "ontoggle_set", arguments)}});
ldvm.toolsFunc.defineProperty(Document.prototype, "onvolumechange", {configurable:true, enumerable:true, get: function (){return ldvm.toolsFunc.dispatch(this, Document.prototype, "Document", "onvolumechange_get", arguments)},set: function (){return ldvm.toolsFunc.dispatch(this, Document.prototype, "Document", "onvolumechange_set", arguments)}});
ldvm.toolsFunc.defineProperty(Document.prototype, "onwaiting", {configurable:true, enumerable:true, get: function (){return ldvm.toolsFunc.dispatch(this, Document.prototype, "Document", "onwaiting_get", arguments)},set: function (){return ldvm.toolsFunc.dispatch(this, Document.prototype, "Document", "onwaiting_set", arguments)}});
ldvm.toolsFunc.defineProperty(Document.prototype, "onwebkitanimationend", {configurable:true, enumerable:true, get: function (){return ldvm.toolsFunc.dispatch(this, Document.prototype, "Document", "onwebkitanimationend_get", arguments)},set: function (){return ldvm.toolsFunc.dispatch(this, Document.prototype, "Document", "onwebkitanimationend_set", arguments)}});
ldvm.toolsFunc.defineProperty(Document.prototype, "onwebkitanimationiteration", {configurable:true, enumerable:true, get: function (){return ldvm.toolsFunc.dispatch(this, Document.prototype, "Document", "onwebkitanimationiteration_get", arguments)},set: function (){return ldvm.toolsFunc.dispatch(this, Document.prototype, "Document", "onwebkitanimationiteration_set", arguments)}});
ldvm.toolsFunc.defineProperty(Document.prototype, "onwebkitanimationstart", {configurable:true, enumerable:true, get: function (){return ldvm.toolsFunc.dispatch(this, Document.prototype, "Document", "onwebkitanimationstart_get", arguments)},set: function (){return ldvm.toolsFunc.dispatch(this, Document.prototype, "Document", "onwebkitanimationstart_set", arguments)}});
ldvm.toolsFunc.defineProperty(Document.prototype, "onwebkittransitionend", {configurable:true, enumerable:true, get: function (){return ldvm.toolsFunc.dispatch(this, Document.prototype, "Document", "onwebkittransitionend_get", arguments)},set: function (){return ldvm.toolsFunc.dispatch(this, Document.prototype, "Document", "onwebkittransitionend_set", arguments)}});
ldvm.toolsFunc.defineProperty(Document.prototype, "onwheel", {configurable:true, enumerable:true, get: function (){return ldvm.toolsFunc.dispatch(this, Document.prototype, "Document", "onwheel_get", arguments)},set: function (){return ldvm.toolsFunc.dispatch(this, Document.prototype, "Document", "onwheel_set", arguments)}});
ldvm.toolsFunc.defineProperty(Document.prototype, "onauxclick", {configurable:true, enumerable:true, get: function (){return ldvm.toolsFunc.dispatch(this, Document.prototype, "Document", "onauxclick_get", arguments)},set: function (){return ldvm.toolsFunc.dispatch(this, Document.prototype, "Document", "onauxclick_set", arguments)}});
ldvm.toolsFunc.defineProperty(Document.prototype, "ongotpointercapture", {configurable:true, enumerable:true, get: function (){return ldvm.toolsFunc.dispatch(this, Document.prototype, "Document", "ongotpointercapture_get", arguments)},set: function (){return ldvm.toolsFunc.dispatch(this, Document.prototype, "Document", "ongotpointercapture_set", arguments)}});
ldvm.toolsFunc.defineProperty(Document.prototype, "onlostpointercapture", {configurable:true, enumerable:true, get: function (){return ldvm.toolsFunc.dispatch(this, Document.prototype, "Document", "onlostpointercapture_get", arguments)},set: function (){return ldvm.toolsFunc.dispatch(this, Document.prototype, "Document", "onlostpointercapture_set", arguments)}});
ldvm.toolsFunc.defineProperty(Document.prototype, "onpointerdown", {configurable:true, enumerable:true, get: function (){return ldvm.toolsFunc.dispatch(this, Document.prototype, "Document", "onpointerdown_get", arguments)},set: function (){return ldvm.toolsFunc.dispatch(this, Document.prototype, "Document", "onpointerdown_set", arguments)}});
ldvm.toolsFunc.defineProperty(Document.prototype, "onpointermove", {configurable:true, enumerable:true, get: function (){return ldvm.toolsFunc.dispatch(this, Document.prototype, "Document", "onpointermove_get", arguments)},set: function (){return ldvm.toolsFunc.dispatch(this, Document.prototype, "Document", "onpointermove_set", arguments)}});
ldvm.toolsFunc.defineProperty(Document.prototype, "onpointerup", {configurable:true, enumerable:true, get: function (){return ldvm.toolsFunc.dispatch(this, Document.prototype, "Document", "onpointerup_get", arguments)},set: function (){return ldvm.toolsFunc.dispatch(this, Document.prototype, "Document", "onpointerup_set", arguments)}});
ldvm.toolsFunc.defineProperty(Document.prototype, "onpointercancel", {configurable:true, enumerable:true, get: function (){return ldvm.toolsFunc.dispatch(this, Document.prototype, "Document", "onpointercancel_get", arguments)},set: function (){return ldvm.toolsFunc.dispatch(this, Document.prototype, "Document", "onpointercancel_set", arguments)}});
ldvm.toolsFunc.defineProperty(Document.prototype, "onpointerover", {configurable:true, enumerable:true, get: function (){return ldvm.toolsFunc.dispatch(this, Document.prototype, "Document", "onpointerover_get", arguments)},set: function (){return ldvm.toolsFunc.dispatch(this, Document.prototype, "Document", "onpointerover_set", arguments)}});
ldvm.toolsFunc.defineProperty(Document.prototype, "onpointerout", {configurable:true, enumerable:true, get: function (){return ldvm.toolsFunc.dispatch(this, Document.prototype, "Document", "onpointerout_get", arguments)},set: function (){return ldvm.toolsFunc.dispatch(this, Document.prototype, "Document", "onpointerout_set", arguments)}});
ldvm.toolsFunc.defineProperty(Document.prototype, "onpointerenter", {configurable:true, enumerable:true, get: function (){return ldvm.toolsFunc.dispatch(this, Document.prototype, "Document", "onpointerenter_get", arguments)},set: function (){return ldvm.toolsFunc.dispatch(this, Document.prototype, "Document", "onpointerenter_set", arguments)}});
ldvm.toolsFunc.defineProperty(Document.prototype, "onpointerleave", {configurable:true, enumerable:true, get: function (){return ldvm.toolsFunc.dispatch(this, Document.prototype, "Document", "onpointerleave_get", arguments)},set: function (){return ldvm.toolsFunc.dispatch(this, Document.prototype, "Document", "onpointerleave_set", arguments)}});
ldvm.toolsFunc.defineProperty(Document.prototype, "onselectstart", {configurable:true, enumerable:true, get: function (){return ldvm.toolsFunc.dispatch(this, Document.prototype, "Document", "onselectstart_get", arguments)},set: function (){return ldvm.toolsFunc.dispatch(this, Document.prototype, "Document", "onselectstart_set", arguments)}});
ldvm.toolsFunc.defineProperty(Document.prototype, "onselectionchange", {configurable:true, enumerable:true, get: function (){return ldvm.toolsFunc.dispatch(this, Document.prototype, "Document", "onselectionchange_get", arguments)},set: function (){return ldvm.toolsFunc.dispatch(this, Document.prototype, "Document", "onselectionchange_set", arguments)}});
ldvm.toolsFunc.defineProperty(Document.prototype, "onanimationcancel", {configurable:true, enumerable:true, get: function (){return ldvm.toolsFunc.dispatch(this, Document.prototype, "Document", "onanimationcancel_get", arguments)},set: function (){return ldvm.toolsFunc.dispatch(this, Document.prototype, "Document", "onanimationcancel_set", arguments)}});
ldvm.toolsFunc.defineProperty(Document.prototype, "onanimationend", {configurable:true, enumerable:true, get: function (){return ldvm.toolsFunc.dispatch(this, Document.prototype, "Document", "onanimationend_get", arguments)},set: function (){return ldvm.toolsFunc.dispatch(this, Document.prototype, "Document", "onanimationend_set", arguments)}});
ldvm.toolsFunc.defineProperty(Document.prototype, "onanimationiteration", {configurable:true, enumerable:true, get: function (){return ldvm.toolsFunc.dispatch(this, Document.prototype, "Document", "onanimationiteration_get", arguments)},set: function (){return ldvm.toolsFunc.dispatch(this, Document.prototype, "Document", "onanimationiteration_set", arguments)}});
ldvm.toolsFunc.defineProperty(Document.prototype, "onanimationstart", {configurable:true, enumerable:true, get: function (){return ldvm.toolsFunc.dispatch(this, Document.prototype, "Document", "onanimationstart_get", arguments)},set: function (){return ldvm.toolsFunc.dispatch(this, Document.prototype, "Document", "onanimationstart_set", arguments)}});
ldvm.toolsFunc.defineProperty(Document.prototype, "ontransitionrun", {configurable:true, enumerable:true, get: function (){return ldvm.toolsFunc.dispatch(this, Document.prototype, "Document", "ontransitionrun_get", arguments)},set: function (){return ldvm.toolsFunc.dispatch(this, Document.prototype, "Document", "ontransitionrun_set", arguments)}});
ldvm.toolsFunc.defineProperty(Document.prototype, "ontransitionstart", {configurable:true, enumerable:true, get: function (){return ldvm.toolsFunc.dispatch(this, Document.prototype, "Document", "ontransitionstart_get", arguments)},set: function (){return ldvm.toolsFunc.dispatch(this, Document.prototype, "Document", "ontransitionstart_set", arguments)}});
ldvm.toolsFunc.defineProperty(Document.prototype, "ontransitionend", {configurable:true, enumerable:true, get: function (){return ldvm.toolsFunc.dispatch(this, Document.prototype, "Document", "ontransitionend_get", arguments)},set: function (){return ldvm.toolsFunc.dispatch(this, Document.prototype, "Document", "ontransitionend_set", arguments)}});
ldvm.toolsFunc.defineProperty(Document.prototype, "ontransitioncancel", {configurable:true, enumerable:true, get: function (){return ldvm.toolsFunc.dispatch(this, Document.prototype, "Document", "ontransitioncancel_get", arguments)},set: function (){return ldvm.toolsFunc.dispatch(this, Document.prototype, "Document", "ontransitioncancel_set", arguments)}});
ldvm.toolsFunc.defineProperty(Document.prototype, "onbeforexrselect", {configurable:true, enumerable:true, get: function (){return ldvm.toolsFunc.dispatch(this, Document.prototype, "Document", "onbeforexrselect_get", arguments)},set: function (){return ldvm.toolsFunc.dispatch(this, Document.prototype, "Document", "onbeforexrselect_set", arguments)}});
ldvm.toolsFunc.defineProperty(Document.prototype, "oncopy", {configurable:true, enumerable:true, get: function (){return ldvm.toolsFunc.dispatch(this, Document.prototype, "Document", "oncopy_get", arguments)},set: function (){return ldvm.toolsFunc.dispatch(this, Document.prototype, "Document", "oncopy_set", arguments)}});
ldvm.toolsFunc.defineProperty(Document.prototype, "oncut", {configurable:true, enumerable:true, get: function (){return ldvm.toolsFunc.dispatch(this, Document.prototype, "Document", "oncut_get", arguments)},set: function (){return ldvm.toolsFunc.dispatch(this, Document.prototype, "Document", "oncut_set", arguments)}});
ldvm.toolsFunc.defineProperty(Document.prototype, "onpaste", {configurable:true, enumerable:true, get: function (){return ldvm.toolsFunc.dispatch(this, Document.prototype, "Document", "onpaste_get", arguments)},set: function (){return ldvm.toolsFunc.dispatch(this, Document.prototype, "Document", "onpaste_set", arguments)}});
ldvm.toolsFunc.defineProperty(Document.prototype, "children", {configurable:true, enumerable:true, get: function (){return ldvm.toolsFunc.dispatch(this, Document.prototype, "Document", "children_get", arguments)},set:undefined});
ldvm.toolsFunc.defineProperty(Document.prototype, "firstElementChild", {configurable:true, enumerable:true, get: function (){return ldvm.toolsFunc.dispatch(this, Document.prototype, "Document", "firstElementChild_get", arguments)},set:undefined});
ldvm.toolsFunc.defineProperty(Document.prototype, "lastElementChild", {configurable:true, enumerable:true, get: function (){return ldvm.toolsFunc.dispatch(this, Document.prototype, "Document", "lastElementChild_get", arguments)},set:undefined});
ldvm.toolsFunc.defineProperty(Document.prototype, "childElementCount", {configurable:true, enumerable:true, get: function (){return ldvm.toolsFunc.dispatch(this, Document.prototype, "Document", "childElementCount_get", arguments)},set:undefined});
ldvm.toolsFunc.defineProperty(Document.prototype, "activeElement", {configurable:true, enumerable:true, get: function (){return ldvm.toolsFunc.dispatch(this, Document.prototype, "Document", "activeElement_get", arguments)},set:undefined});
ldvm.toolsFunc.defineProperty(Document.prototype, "styleSheets", {configurable:true, enumerable:true, get: function (){return ldvm.toolsFunc.dispatch(this, Document.prototype, "Document", "styleSheets_get", arguments)},set:undefined});
ldvm.toolsFunc.defineProperty(Document.prototype, "pointerLockElement", {configurable:true, enumerable:true, get: function (){return ldvm.toolsFunc.dispatch(this, Document.prototype, "Document", "pointerLockElement_get", arguments)},set:undefined});
ldvm.toolsFunc.defineProperty(Document.prototype, "fullscreenElement", {configurable:true, enumerable:true, get: function (){return ldvm.toolsFunc.dispatch(this, Document.prototype, "Document", "fullscreenElement_get", arguments)},set: function (){return ldvm.toolsFunc.dispatch(this, Document.prototype, "Document", "fullscreenElement_set", arguments)}});
ldvm.toolsFunc.defineProperty(Document.prototype, "adoptedStyleSheets", {configurable:true, enumerable:true, get: function (){return ldvm.toolsFunc.dispatch(this, Document.prototype, "Document", "adoptedStyleSheets_get", arguments)},set: function (){return ldvm.toolsFunc.dispatch(this, Document.prototype, "Document", "adoptedStyleSheets_set", arguments)}});
ldvm.toolsFunc.defineProperty(Document.prototype, "pictureInPictureElement", {configurable:true, enumerable:true, get: function (){return ldvm.toolsFunc.dispatch(this, Document.prototype, "Document", "pictureInPictureElement_get", arguments)},set:undefined});
ldvm.toolsFunc.defineProperty(Document.prototype, "fonts", {configurable:true, enumerable:true, get: function (){return ldvm.toolsFunc.dispatch(this, Document.prototype, "Document", "fonts_get", arguments)},set:undefined});
ldvm.toolsFunc.defineProperty(Document.prototype, "adoptNode", {configurable:true, enumerable:true, writable:true, value: function (){return ldvm.toolsFunc.dispatch(this, Document.prototype, "Document", "adoptNode", arguments)}});
ldvm.toolsFunc.defineProperty(Document.prototype, "append", {configurable:true, enumerable:true, writable:true, value: function (){return ldvm.toolsFunc.dispatch(this, Document.prototype, "Document", "append", arguments)}});
ldvm.toolsFunc.defineProperty(Document.prototype, "captureEvents", {configurable:true, enumerable:true, writable:true, value: function (){return ldvm.toolsFunc.dispatch(this, Document.prototype, "Document", "captureEvents", arguments)}});
ldvm.toolsFunc.defineProperty(Document.prototype, "caretPositionFromPoint", {configurable:true, enumerable:true, writable:true, value: function (){return ldvm.toolsFunc.dispatch(this, Document.prototype, "Document", "caretPositionFromPoint", arguments)}});
ldvm.toolsFunc.defineProperty(Document.prototype, "caretRangeFromPoint", {configurable:true, enumerable:true, writable:true, value: function (){return ldvm.toolsFunc.dispatch(this, Document.prototype, "Document", "caretRangeFromPoint", arguments)}});
ldvm.toolsFunc.defineProperty(Document.prototype, "clear", {configurable:true, enumerable:true, writable:true, value: function (){return ldvm.toolsFunc.dispatch(this, Document.prototype, "Document", "clear", arguments)}});
ldvm.toolsFunc.defineProperty(Document.prototype, "close", {configurable:true, enumerable:true, writable:true, value: function (){return ldvm.toolsFunc.dispatch(this, Document.prototype, "Document", "close", arguments)}});
ldvm.toolsFunc.defineProperty(Document.prototype, "createAttribute", {configurable:true, enumerable:true, writable:true, value: function (){return ldvm.toolsFunc.dispatch(this, Document.prototype, "Document", "createAttribute", arguments)}});
ldvm.toolsFunc.defineProperty(Document.prototype, "createAttributeNS", {configurable:true, enumerable:true, writable:true, value: function (){return ldvm.toolsFunc.dispatch(this, Document.prototype, "Document", "createAttributeNS", arguments)}});
ldvm.toolsFunc.defineProperty(Document.prototype, "createCDATASection", {configurable:true, enumerable:true, writable:true, value: function (){return ldvm.toolsFunc.dispatch(this, Document.prototype, "Document", "createCDATASection", arguments)}});
ldvm.toolsFunc.defineProperty(Document.prototype, "createComment", {configurable:true, enumerable:true, writable:true, value: function (){return ldvm.toolsFunc.dispatch(this, Document.prototype, "Document", "createComment", arguments)}});
ldvm.toolsFunc.defineProperty(Document.prototype, "createDocumentFragment", {configurable:true, enumerable:true, writable:true, value: function (){return ldvm.toolsFunc.dispatch(this, Document.prototype, "Document", "createDocumentFragment", arguments)}});
ldvm.toolsFunc.defineProperty(Document.prototype, "createElementNS", {configurable:true, enumerable:true, writable:true, value: function (){return ldvm.toolsFunc.dispatch(this, Document.prototype, "Document", "createElementNS", arguments)}});
ldvm.toolsFunc.defineProperty(Document.prototype, "createEvent", {configurable:true, enumerable:true, writable:true, value: function (){return ldvm.toolsFunc.dispatch(this, Document.prototype, "Document", "createEvent", arguments)}});
ldvm.toolsFunc.defineProperty(Document.prototype, "createExpression", {configurable:true, enumerable:true, writable:true, value: function (){return ldvm.toolsFunc.dispatch(this, Document.prototype, "Document", "createExpression", arguments)}});
ldvm.toolsFunc.defineProperty(Document.prototype, "createNSResolver", {configurable:true, enumerable:true, writable:true, value: function (){return ldvm.toolsFunc.dispatch(this, Document.prototype, "Document", "createNSResolver", arguments)}});
ldvm.toolsFunc.defineProperty(Document.prototype, "createNodeIterator", {configurable:true, enumerable:true, writable:true, value: function (){return ldvm.toolsFunc.dispatch(this, Document.prototype, "Document", "createNodeIterator", arguments)}});
ldvm.toolsFunc.defineProperty(Document.prototype, "createProcessingInstruction", {configurable:true, enumerable:true, writable:true, value: function (){return ldvm.toolsFunc.dispatch(this, Document.prototype, "Document", "createProcessingInstruction", arguments)}});
ldvm.toolsFunc.defineProperty(Document.prototype, "createRange", {configurable:true, enumerable:true, writable:true, value: function (){return ldvm.toolsFunc.dispatch(this, Document.prototype, "Document", "createRange", arguments)}});
ldvm.toolsFunc.defineProperty(Document.prototype, "createTextNode", {configurable:true, enumerable:true, writable:true, value: function (){return ldvm.toolsFunc.dispatch(this, Document.prototype, "Document", "createTextNode", arguments)}});
ldvm.toolsFunc.defineProperty(Document.prototype, "createTreeWalker", {configurable:true, enumerable:true, writable:true, value: function (){return ldvm.toolsFunc.dispatch(this, Document.prototype, "Document", "createTreeWalker", arguments)}});
ldvm.toolsFunc.defineProperty(Document.prototype, "elementFromPoint", {configurable:true, enumerable:true, writable:true, value: function (){return ldvm.toolsFunc.dispatch(this, Document.prototype, "Document", "elementFromPoint", arguments)}});
ldvm.toolsFunc.defineProperty(Document.prototype, "elementsFromPoint", {configurable:true, enumerable:true, writable:true, value: function (){return ldvm.toolsFunc.dispatch(this, Document.prototype, "Document", "elementsFromPoint", arguments)}});
ldvm.toolsFunc.defineProperty(Document.prototype, "evaluate", {configurable:true, enumerable:true, writable:true, value: function (){return ldvm.toolsFunc.dispatch(this, Document.prototype, "Document", "evaluate", arguments)}});
ldvm.toolsFunc.defineProperty(Document.prototype, "execCommand", {configurable:true, enumerable:true, writable:true, value: function (){return ldvm.toolsFunc.dispatch(this, Document.prototype, "Document", "execCommand", arguments)}});
ldvm.toolsFunc.defineProperty(Document.prototype, "exitFullscreen", {configurable:true, enumerable:true, writable:true, value: function (){return ldvm.toolsFunc.dispatch(this, Document.prototype, "Document", "exitFullscreen", arguments)}});
ldvm.toolsFunc.defineProperty(Document.prototype, "exitPictureInPicture", {configurable:true, enumerable:true, writable:true, value: function (){return ldvm.toolsFunc.dispatch(this, Document.prototype, "Document", "exitPictureInPicture", arguments)}});
ldvm.toolsFunc.defineProperty(Document.prototype, "exitPointerLock", {configurable:true, enumerable:true, writable:true, value: function (){return ldvm.toolsFunc.dispatch(this, Document.prototype, "Document", "exitPointerLock", arguments)}});
ldvm.toolsFunc.defineProperty(Document.prototype, "getAnimations", {configurable:true, enumerable:true, writable:true, value: function (){return ldvm.toolsFunc.dispatch(this, Document.prototype, "Document", "getAnimations", arguments)}});
ldvm.toolsFunc.defineProperty(Document.prototype, "getElementById", {configurable:true, enumerable:true, writable:true, value: function (){return ldvm.toolsFunc.dispatch(this, Document.prototype, "Document", "getElementById", arguments)}});
ldvm.toolsFunc.defineProperty(Document.prototype, "getElementsByClassName", {configurable:true, enumerable:true, writable:true, value: function (){return ldvm.toolsFunc.dispatch(this, Document.prototype, "Document", "getElementsByClassName", arguments)}});
ldvm.toolsFunc.defineProperty(Document.prototype, "getElementsByName", {configurable:true, enumerable:true, writable:true, value: function (){return ldvm.toolsFunc.dispatch(this, Document.prototype, "Document", "getElementsByName", arguments)}});
ldvm.toolsFunc.defineProperty(Document.prototype, "getElementsByTagName", {configurable:true, enumerable:true, writable:true, value: function (){return ldvm.toolsFunc.dispatch(this, Document.prototype, "Document", "getElementsByTagName", arguments)}});
ldvm.toolsFunc.defineProperty(Document.prototype, "getElementsByTagNameNS", {configurable:true, enumerable:true, writable:true, value: function (){return ldvm.toolsFunc.dispatch(this, Document.prototype, "Document", "getElementsByTagNameNS", arguments)}});
ldvm.toolsFunc.defineProperty(Document.prototype, "getSelection", {configurable:true, enumerable:true, writable:true, value: function (){return ldvm.toolsFunc.dispatch(this, Document.prototype, "Document", "getSelection", arguments)}});
ldvm.toolsFunc.defineProperty(Document.prototype, "hasFocus", {configurable:true, enumerable:true, writable:true, value: function (){return ldvm.toolsFunc.dispatch(this, Document.prototype, "Document", "hasFocus", arguments)}});
ldvm.toolsFunc.defineProperty(Document.prototype, "hasStorageAccess", {configurable:true, enumerable:true, writable:true, value: function (){return ldvm.toolsFunc.dispatch(this, Document.prototype, "Document", "hasStorageAccess", arguments)}});
ldvm.toolsFunc.defineProperty(Document.prototype, "hasUnpartitionedCookieAccess", {configurable:true, enumerable:true, writable:true, value: function (){return ldvm.toolsFunc.dispatch(this, Document.prototype, "Document", "hasUnpartitionedCookieAccess", arguments)}});
ldvm.toolsFunc.defineProperty(Document.prototype, "importNode", {configurable:true, enumerable:true, writable:true, value: function (){return ldvm.toolsFunc.dispatch(this, Document.prototype, "Document", "importNode", arguments)}});
ldvm.toolsFunc.defineProperty(Document.prototype, "moveBefore", {configurable:true, enumerable:true, writable:true, value: function (){return ldvm.toolsFunc.dispatch(this, Document.prototype, "Document", "moveBefore", arguments)}});
ldvm.toolsFunc.defineProperty(Document.prototype, "open", {configurable:true, enumerable:true, writable:true, value: function (){return ldvm.toolsFunc.dispatch(this, Document.prototype, "Document", "open", arguments)}});
ldvm.toolsFunc.defineProperty(Document.prototype, "prepend", {configurable:true, enumerable:true, writable:true, value: function (){return ldvm.toolsFunc.dispatch(this, Document.prototype, "Document", "prepend", arguments)}});
ldvm.toolsFunc.defineProperty(Document.prototype, "queryCommandEnabled", {configurable:true, enumerable:true, writable:true, value: function (){return ldvm.toolsFunc.dispatch(this, Document.prototype, "Document", "queryCommandEnabled", arguments)}});
ldvm.toolsFunc.defineProperty(Document.prototype, "queryCommandIndeterm", {configurable:true, enumerable:true, writable:true, value: function (){return ldvm.toolsFunc.dispatch(this, Document.prototype, "Document", "queryCommandIndeterm", arguments)}});
ldvm.toolsFunc.defineProperty(Document.prototype, "queryCommandState", {configurable:true, enumerable:true, writable:true, value: function (){return ldvm.toolsFunc.dispatch(this, Document.prototype, "Document", "queryCommandState", arguments)}});
ldvm.toolsFunc.defineProperty(Document.prototype, "queryCommandSupported", {configurable:true, enumerable:true, writable:true, value: function (){return ldvm.toolsFunc.dispatch(this, Document.prototype, "Document", "queryCommandSupported", arguments)}});
ldvm.toolsFunc.defineProperty(Document.prototype, "queryCommandValue", {configurable:true, enumerable:true, writable:true, value: function (){return ldvm.toolsFunc.dispatch(this, Document.prototype, "Document", "queryCommandValue", arguments)}});
ldvm.toolsFunc.defineProperty(Document.prototype, "querySelector", {configurable:true, enumerable:true, writable:true, value: function (){return ldvm.toolsFunc.dispatch(this, Document.prototype, "Document", "querySelector", arguments)}});
ldvm.toolsFunc.defineProperty(Document.prototype, "querySelectorAll", {configurable:true, enumerable:true, writable:true, value: function (){return ldvm.toolsFunc.dispatch(this, Document.prototype, "Document", "querySelectorAll", arguments)}});
ldvm.toolsFunc.defineProperty(Document.prototype, "releaseEvents", {configurable:true, enumerable:true, writable:true, value: function (){return ldvm.toolsFunc.dispatch(this, Document.prototype, "Document", "releaseEvents", arguments)}});
ldvm.toolsFunc.defineProperty(Document.prototype, "replaceChildren", {configurable:true, enumerable:true, writable:true, value: function (){return ldvm.toolsFunc.dispatch(this, Document.prototype, "Document", "replaceChildren", arguments)}});
ldvm.toolsFunc.defineProperty(Document.prototype, "requestStorageAccess", {configurable:true, enumerable:true, writable:true, value: function (){return ldvm.toolsFunc.dispatch(this, Document.prototype, "Document", "requestStorageAccess", arguments)}});
ldvm.toolsFunc.defineProperty(Document.prototype, "requestStorageAccessFor", {configurable:true, enumerable:true, writable:true, value: function (){return ldvm.toolsFunc.dispatch(this, Document.prototype, "Document", "requestStorageAccessFor", arguments)}});
ldvm.toolsFunc.defineProperty(Document.prototype, "startViewTransition", {configurable:true, enumerable:true, writable:true, value: function (){return ldvm.toolsFunc.dispatch(this, Document.prototype, "Document", "startViewTransition", arguments)}});
ldvm.toolsFunc.defineProperty(Document.prototype, "webkitCancelFullScreen", {configurable:true, enumerable:true, writable:true, value: function (){return ldvm.toolsFunc.dispatch(this, Document.prototype, "Document", "webkitCancelFullScreen", arguments)}});
ldvm.toolsFunc.defineProperty(Document.prototype, "webkitExitFullscreen", {configurable:true, enumerable:true, writable:true, value: function (){return ldvm.toolsFunc.dispatch(this, Document.prototype, "Document", "webkitExitFullscreen", arguments)}});
ldvm.toolsFunc.defineProperty(Document.prototype, "write", {configurable:true, enumerable:true, writable:true, value: function (){return ldvm.toolsFunc.dispatch(this, Document.prototype, "Document", "write", arguments)}});
ldvm.toolsFunc.defineProperty(Document.prototype, "writeln", {configurable:true, enumerable:true, writable:true, value: function (){return ldvm.toolsFunc.dispatch(this, Document.prototype, "Document", "writeln", arguments)}});
ldvm.toolsFunc.defineProperty(Document.prototype, "fragmentDirective", {configurable:true, enumerable:true, get: function (){return ldvm.toolsFunc.dispatch(this, Document.prototype, "Document", "fragmentDirective_get", arguments)},set:undefined});
ldvm.toolsFunc.defineProperty(Document.prototype, "onpointerrawupdate", {configurable:true, enumerable:true, get: function (){return ldvm.toolsFunc.dispatch(this, Document.prototype, "Document", "onpointerrawupdate_get", arguments)},set: function (){return ldvm.toolsFunc.dispatch(this, Document.prototype, "Document", "onpointerrawupdate_set", arguments)}});
ldvm.toolsFunc.defineProperty(Document.prototype, "browsingTopics", {configurable:true, enumerable:true, writable:true, value: function (){return ldvm.toolsFunc.dispatch(this, Document.prototype, "Document", "browsingTopics", arguments)}});
ldvm.toolsFunc.defineProperty(Document.prototype, "hasPrivateToken", {configurable:true, enumerable:true, writable:true, value: function (){return ldvm.toolsFunc.dispatch(this, Document.prototype, "Document", "hasPrivateToken", arguments)}});
ldvm.toolsFunc.defineProperty(Document.prototype, "hasRedemptionRecord", {configurable:true, enumerable:true, writable:true, value: function (){return ldvm.toolsFunc.dispatch(this, Document.prototype, "Document", "hasRedemptionRecord", arguments)}});
ldvm.toolsFunc.defineProperty(Document.prototype, "activeViewTransition", {configurable:true, enumerable:true, get: function (){return ldvm.toolsFunc.dispatch(this, Document.prototype, "Document", "activeViewTransition_get", arguments)},set:undefined});
ldvm.toolsFunc.defineProperty(Document.prototype, "onscrollsnapchange", {configurable:true, enumerable:true, get: function (){return ldvm.toolsFunc.dispatch(this, Document.prototype, "Document", "onscrollsnapchange_get", arguments)},set: function (){return ldvm.toolsFunc.dispatch(this, Document.prototype, "Document", "onscrollsnapchange_set", arguments)}});
ldvm.toolsFunc.defineProperty(Document.prototype, "onscrollsnapchanging", {configurable:true, enumerable:true, get: function (){return ldvm.toolsFunc.dispatch(this, Document.prototype, "Document", "onscrollsnapchanging_get", arguments)},set: function (){return ldvm.toolsFunc.dispatch(this, Document.prototype, "Document", "onscrollsnapchanging_set", arguments)}});
ldvm.toolsFunc.defineProperty(Document.prototype, "customElementRegistry", {configurable:true, enumerable:true, get: function (){return ldvm.toolsFunc.dispatch(this, Document.prototype, "Document", "customElementRegistry_get", arguments)},set:undefined});
ldvm.toolsFunc.defineProperty(Document.prototype, "ariaNotify", {configurable:true, enumerable:true, writable:true, value: function (){return ldvm.toolsFunc.dispatch(this, Document.prototype, "Document", "ariaNotify", arguments)}});



// Plugin对象
Plugin = function Plugin(){ldvm.toolsFunc.throwError("TypeError", "Failed to construct 'Plugin': Illegal constructor")}
ldvm.toolsFunc.safeProto(Plugin, "Plugin");
Object.setPrototypeOf(Plugin.prototype, Object.prototype);
ldvm.toolsFunc.defineProperty(Plugin.prototype, "name", {configurable:true, enumerable:true, get: function (){return ldvm.toolsFunc.dispatch(this, Plugin.prototype, "Plugin", "name_get", arguments)},set:undefined});
ldvm.toolsFunc.defineProperty(Plugin.prototype, "filename", {configurable:true, enumerable:true, get: function (){return ldvm.toolsFunc.dispatch(this, Plugin.prototype, "Plugin", "filename_get", arguments)},set:undefined});
ldvm.toolsFunc.defineProperty(Plugin.prototype, "description", {configurable:true, enumerable:true, get: function (){return ldvm.toolsFunc.dispatch(this, Plugin.prototype, "Plugin", "description_get", arguments)},set:undefined});
ldvm.toolsFunc.defineProperty(Plugin.prototype, "length", {configurable:true, enumerable:true, get: function (){return ldvm.toolsFunc.dispatch(this, Plugin.prototype, "Plugin", "length_get", arguments)},set:undefined});
ldvm.toolsFunc.defineProperty(Plugin.prototype, "item", {configurable:true, enumerable:true, writable:true, value: function (){return ldvm.toolsFunc.dispatch(this, Plugin.prototype, "Plugin", "item", arguments)}});
ldvm.toolsFunc.defineProperty(Plugin.prototype, "namedItem", {configurable:true, enumerable:true, writable:true, value: function (){return ldvm.toolsFunc.dispatch(this, Plugin.prototype, "Plugin", "namedItem", arguments)}});

// HTMLDocument对象
HTMLDocument = function HTMLDocument(){ldvm.toolsFunc.throwError("TypeError", "Failed to construct 'HTMLDocument': Illegal constructor")}
ldvm.toolsFunc.safeProto(HTMLDocument, "HTMLDocument");
Object.setPrototypeOf(HTMLDocument.prototype, Document.prototype);

//document对象
document = {};
//设置原型
Object.setPrototypeOf(document,HTMLDocument.prototype );
//定义自身属性
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

// Navigator对象
Navigator = function Navigator(){ldvm.toolsFunc.throwError("TypeError", "Failed to construct 'Navigator': Illegal constructor")}
ldvm.toolsFunc.safeProto(Navigator, "Navigator");
Object.setPrototypeOf(Navigator.prototype, Object.prototype);
ldvm.toolsFunc.defineProperty(Navigator.prototype, "vendorSub", {configurable:true, enumerable:true, get: function (){return ldvm.toolsFunc.dispatch(this, Navigator.prototype, "Navigator", "vendorSub_get", arguments)},set:undefined});
ldvm.toolsFunc.defineProperty(Navigator.prototype, "productSub", {configurable:true, enumerable:true, get: function (){return ldvm.toolsFunc.dispatch(this, Navigator.prototype, "Navigator", "productSub_get", arguments)},set:undefined});
ldvm.toolsFunc.defineProperty(Navigator.prototype, "vendor", {configurable:true, enumerable:true, get: function (){return ldvm.toolsFunc.dispatch(this, Navigator.prototype, "Navigator", "vendor_get", arguments)},set:undefined});
ldvm.toolsFunc.defineProperty(Navigator.prototype, "maxTouchPoints", {configurable:true, enumerable:true, get: function (){return ldvm.toolsFunc.dispatch(this, Navigator.prototype, "Navigator", "maxTouchPoints_get", arguments)},set:undefined});
ldvm.toolsFunc.defineProperty(Navigator.prototype, "scheduling", {configurable:true, enumerable:true, get: function (){return ldvm.toolsFunc.dispatch(this, Navigator.prototype, "Navigator", "scheduling_get", arguments)},set:undefined});
ldvm.toolsFunc.defineProperty(Navigator.prototype, "userActivation", {configurable:true, enumerable:true, get: function (){return ldvm.toolsFunc.dispatch(this, Navigator.prototype, "Navigator", "userActivation_get", arguments)},set:undefined});
ldvm.toolsFunc.defineProperty(Navigator.prototype, "geolocation", {configurable:true, enumerable:true, get: function (){return ldvm.toolsFunc.dispatch(this, Navigator.prototype, "Navigator", "geolocation_get", arguments)},set:undefined});
ldvm.toolsFunc.defineProperty(Navigator.prototype, "doNotTrack", {configurable:true, enumerable:true, get: function (){return ldvm.toolsFunc.dispatch(this, Navigator.prototype, "Navigator", "doNotTrack_get", arguments)},set:undefined});
ldvm.toolsFunc.defineProperty(Navigator.prototype, "webkitTemporaryStorage", {configurable:true, enumerable:true, get: function (){return ldvm.toolsFunc.dispatch(this, Navigator.prototype, "Navigator", "webkitTemporaryStorage_get", arguments)},set:undefined});
ldvm.toolsFunc.defineProperty(Navigator.prototype, "webkitPersistentStorage", {configurable:true, enumerable:true, get: function (){return ldvm.toolsFunc.dispatch(this, Navigator.prototype, "Navigator", "webkitPersistentStorage_get", arguments)},set:undefined});
ldvm.toolsFunc.defineProperty(Navigator.prototype, "hardwareConcurrency", {configurable:true, enumerable:true, get: function (){return ldvm.toolsFunc.dispatch(this, Navigator.prototype, "Navigator", "hardwareConcurrency_get", arguments)},set:undefined});
ldvm.toolsFunc.defineProperty(Navigator.prototype, "cookieEnabled", {configurable:true, enumerable:true, get: function (){return ldvm.toolsFunc.dispatch(this, Navigator.prototype, "Navigator", "cookieEnabled_get", arguments)},set:undefined});
ldvm.toolsFunc.defineProperty(Navigator.prototype, "appCodeName", {configurable:true, enumerable:true, get: function (){return ldvm.toolsFunc.dispatch(this, Navigator.prototype, "Navigator", "appCodeName_get", arguments)},set:undefined});
ldvm.toolsFunc.defineProperty(Navigator.prototype, "appName", {configurable:true, enumerable:true, get: function (){return ldvm.toolsFunc.dispatch(this, Navigator.prototype, "Navigator", "appName_get", arguments)},set:undefined});
ldvm.toolsFunc.defineProperty(Navigator.prototype, "appVersion", {configurable:true, enumerable:true, get: function (){return ldvm.toolsFunc.dispatch(this, Navigator.prototype, "Navigator", "appVersion_get", arguments)},set:undefined});
ldvm.toolsFunc.defineProperty(Navigator.prototype, "platform", {configurable:true, enumerable:true, get: function (){return ldvm.toolsFunc.dispatch(this, Navigator.prototype, "Navigator", "platform_get", arguments)},set:undefined});
ldvm.toolsFunc.defineProperty(Navigator.prototype, "product", {configurable:true, enumerable:true, get: function (){return ldvm.toolsFunc.dispatch(this, Navigator.prototype, "Navigator", "product_get", arguments)},set:undefined});
ldvm.toolsFunc.defineProperty(Navigator.prototype, "userAgent", {configurable:true, enumerable:true, get: function (){return ldvm.toolsFunc.dispatch(this, Navigator.prototype, "Navigator", "userAgent_get", arguments)},set:undefined});
ldvm.toolsFunc.defineProperty(Navigator.prototype, "language", {configurable:true, enumerable:true, get: function (){return ldvm.toolsFunc.dispatch(this, Navigator.prototype, "Navigator", "language_get", arguments)},set:undefined});
ldvm.toolsFunc.defineProperty(Navigator.prototype, "languages", {configurable:true, enumerable:true, get: function (){return ldvm.toolsFunc.dispatch(this, Navigator.prototype, "Navigator", "languages_get", arguments)},set:undefined});
ldvm.toolsFunc.defineProperty(Navigator.prototype, "onLine", {configurable:true, enumerable:true, get: function (){return ldvm.toolsFunc.dispatch(this, Navigator.prototype, "Navigator", "onLine_get", arguments)},set:undefined});
ldvm.toolsFunc.defineProperty(Navigator.prototype, "webdriver", {configurable:true, enumerable:true, get: function (){return ldvm.toolsFunc.dispatch(this, Navigator.prototype, "Navigator", "webdriver_get", arguments)},set:undefined});
ldvm.toolsFunc.defineProperty(Navigator.prototype, "plugins", {configurable:true, enumerable:true, get: function (){return ldvm.toolsFunc.dispatch(this, Navigator.prototype, "Navigator", "plugins_get", arguments)},set:undefined});
ldvm.toolsFunc.defineProperty(Navigator.prototype, "mimeTypes", {configurable:true, enumerable:true, get: function (){return ldvm.toolsFunc.dispatch(this, Navigator.prototype, "Navigator", "mimeTypes_get", arguments)},set:undefined});
ldvm.toolsFunc.defineProperty(Navigator.prototype, "pdfViewerEnabled", {configurable:true, enumerable:true, get: function (){return ldvm.toolsFunc.dispatch(this, Navigator.prototype, "Navigator", "pdfViewerEnabled_get", arguments)},set:undefined});
ldvm.toolsFunc.defineProperty(Navigator.prototype, "connection", {configurable:true, enumerable:true, get: function (){return ldvm.toolsFunc.dispatch(this, Navigator.prototype, "Navigator", "connection_get", arguments)},set:undefined});
ldvm.toolsFunc.defineProperty(Navigator.prototype, "getGamepads", {configurable:true, enumerable:true, writable:true, value: function (){return ldvm.toolsFunc.dispatch(this, Navigator.prototype, "Navigator", "getGamepads", arguments)}});
ldvm.toolsFunc.defineProperty(Navigator.prototype, "javaEnabled", {configurable:true, enumerable:true, writable:true, value: function (){return ldvm.toolsFunc.dispatch(this, Navigator.prototype, "Navigator", "javaEnabled", arguments)}});
ldvm.toolsFunc.defineProperty(Navigator.prototype, "sendBeacon", {configurable:true, enumerable:true, writable:true, value: function (){return ldvm.toolsFunc.dispatch(this, Navigator.prototype, "Navigator", "sendBeacon", arguments)}});
ldvm.toolsFunc.defineProperty(Navigator.prototype, "vibrate", {configurable:true, enumerable:true, writable:true, value: function (){return ldvm.toolsFunc.dispatch(this, Navigator.prototype, "Navigator", "vibrate", arguments)}});
ldvm.toolsFunc.defineProperty(Navigator.prototype, "windowControlsOverlay", {configurable:true, enumerable:true, get: function (){return ldvm.toolsFunc.dispatch(this, Navigator.prototype, "Navigator", "windowControlsOverlay_get", arguments)},set:undefined});
ldvm.toolsFunc.defineProperty(Navigator.prototype, "ink", {configurable:true, enumerable:true, get: function (){return ldvm.toolsFunc.dispatch(this, Navigator.prototype, "Navigator", "ink_get", arguments)},set:undefined});
ldvm.toolsFunc.defineProperty(Navigator.prototype, "mediaCapabilities", {configurable:true, enumerable:true, get: function (){return ldvm.toolsFunc.dispatch(this, Navigator.prototype, "Navigator", "mediaCapabilities_get", arguments)},set:undefined});
ldvm.toolsFunc.defineProperty(Navigator.prototype, "permissions", {configurable:true, enumerable:true, get: function (){return ldvm.toolsFunc.dispatch(this, Navigator.prototype, "Navigator", "permissions_get", arguments)},set:undefined});
ldvm.toolsFunc.defineProperty(Navigator.prototype, "mediaSession", {configurable:true, enumerable:true, get: function (){return ldvm.toolsFunc.dispatch(this, Navigator.prototype, "Navigator", "mediaSession_get", arguments)},set:undefined});

// navigator对象
navigator = {};
Object.setPrototypeOf(navigator, Navigator.prototype); 

// Storage对象
Storage = function Storage(){ldvm.toolsFunc.throwError("TypeError", "Failed to construct 'Storage': Illegal constructor")}
ldvm.toolsFunc.safeProto(Storage, "Storage");
Object.setPrototypeOf(Storage.prototype, Object.prototype);
ldvm.toolsFunc.defineProperty(Storage.prototype, "length", {configurable:true, enumerable:true, get: function (){return ldvm.toolsFunc.dispatch(this, Storage.prototype, "Storage", "length_get", arguments)},set:undefined});
ldvm.toolsFunc.defineProperty(Storage.prototype, "clear", {configurable:true, enumerable:true, writable:true, value: function (){return ldvm.toolsFunc.dispatch(this, Storage.prototype, "Storage", "clear", arguments)}});
ldvm.toolsFunc.defineProperty(Storage.prototype, "getItem", {configurable:true, enumerable:true, writable:true, value: function (){return ldvm.toolsFunc.dispatch(this, Storage.prototype, "Storage", "getItem", arguments)}});
ldvm.toolsFunc.defineProperty(Storage.prototype, "key", {configurable:true, enumerable:true, writable:true, value: function (){return ldvm.toolsFunc.dispatch(this, Storage.prototype, "Storage", "key", arguments)}});
ldvm.toolsFunc.defineProperty(Storage.prototype, "removeItem", {configurable:true, enumerable:true, writable:true, value: function (){return ldvm.toolsFunc.dispatch(this, Storage.prototype, "Storage", "removeItem", arguments)}});
ldvm.toolsFunc.defineProperty(Storage.prototype, "setItem", {configurable:true, enumerable:true, writable:true, value: function (){return ldvm.toolsFunc.dispatch(this, Storage.prototype, "Storage", "setItem", arguments)}});

//localStorage
localStorage = {};
Object.setPrototypeOf(localStorage, Storage.prototype); 

// sessionStorage对象
sessionStorage = {};
Object.setPrototypeOf(sessionStorage, Storage.prototype); 

// HTMLCollection对象
HTMLCollection = function HTMLCollection(){ldvm.toolsFunc.throwError("TypeError", "Failed to construct 'HTMLCollection': Illegal constructor")}
ldvm.toolsFunc.safeProto(HTMLCollection, "HTMLCollection");
Object.setPrototypeOf(HTMLCollection.prototype, Object.prototype);
ldvm.toolsFunc.defineProperty(HTMLCollection.prototype, "length", {configurable:true, enumerable:true, get: function (){return ldvm.toolsFunc.dispatch(this, HTMLCollection.prototype, "HTMLCollection", "length_get", arguments)},set:undefined});
ldvm.toolsFunc.defineProperty(HTMLCollection.prototype, "item", {configurable:true, enumerable:true, writable:true, value: function (){return ldvm.toolsFunc.dispatch(this, HTMLCollection.prototype, "HTMLCollection", "item", arguments)}});
ldvm.toolsFunc.defineProperty(HTMLCollection.prototype, "namedItem", {configurable:true, enumerable:true, writable:true, value: function (){return ldvm.toolsFunc.dispatch(this, HTMLCollection.prototype, "HTMLCollection", "namedItem", arguments)}});

//window对象
//设置window原型 ,把window的原型设置为Window(大写)
window = globalThis
delete global
delete Buffer
delete globalThis[Symbol.toStringTag];


//删除WindowProperties.prototype.constructor--浏览器没有
delete WindowProperties.prototype.constructor

Object.setPrototypeOf(window, Window.prototype)
//console.log(window.__proto__, Object.getPrototypeOf(window),window.__proto__=== Object.getPrototypeOf(window))

//添加atob属性(内部有保护方法)
ldvm.toolsFunc.defineProperty(window, "atob", {
    configurable: true, 
    enumerable: true, 
    writable: true,
    value: function atob(str){
        return ldvm.toolsFunc.base64.base64decode(str)
    }
})

//添加btoa属性(内部有保护方法)
ldvm.toolsFunc.defineProperty(window, "btoa", {
    configurable: true, 
    enumerable: true, 
    writable: true,
    value: function btoa(str){
        return ldvm.toolsFunc.base64.base64encode(str)
    }
})

//window原型Window的属性--（其他属性相同或者外面拿不到）
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

//Window.prototype--window原型对象属性
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

//定义name属性
ldvm.toolsFunc.defineProperty(window, "name", {
    configurable: true,
    enumerable: true,
    get: function () {},
    set: function () {}
});

ldvm.toolsFunc.defineProperty(window, "top", {configurable:false, enumerable:true, get: function (){return ldvm.toolsFunc.dispatch(this, window, "Window", "top_get", arguments)},set:undefined}); 
ldvm.toolsFunc.defineProperty(window, "self", {configurable:true, enumerable:true, get: function (){return ldvm.toolsFunc.dispatch(this, window, "Window", "self_get", arguments)},set: function (){return ldvm.toolsFunc.dispatch(this, window, "Window", "self_set", arguments)}}); 
ldvm.toolsFunc.defineProperty(window, "parent", {configurable:true, enumerable:true, get: function (){return ldvm.toolsFunc.dispatch(this, window, "Window", "parent_get", arguments)},set: function (){return ldvm.toolsFunc.dispatch(this, window, "Window", "parent_set", arguments)}}); 
eval = ldvm.toolsFunc.hook(eval, undefined, false, function(){}, function(){})
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
ldvm.toolsFunc.defineProperty(window, "Location", {configurable:true, enumerable:false, writable:true, value: function (){return ldvm.toolsFunc.dispatch(this, window, "Window", "Location", arguments)}}); 
ldvm.toolsFunc.defineProperty(window, "location", {configurable:false, enumerable:true, get: function (){return ldvm.toolsFunc.dispatch(this, window, "Window", "location_get", arguments)},set: function (){return ldvm.toolsFunc.dispatch(this, window, "Window", "location_set", arguments)}}); 


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



//用户代码


//用户代码
//异步执行代

