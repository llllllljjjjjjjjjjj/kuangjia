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
