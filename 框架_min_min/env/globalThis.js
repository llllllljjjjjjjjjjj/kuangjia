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
