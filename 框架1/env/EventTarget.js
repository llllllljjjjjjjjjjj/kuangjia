
// EventTarget对象
EventTarget = function EventTarget(){}
ldvm.toolsFunc.safeProto(EventTarget, "EventTarget");
Object.setPrototypeOf(EventTarget.prototype, Object.prototype);
ldvm.toolsFunc.defineProperty(EventTarget.prototype, "addEventListener", {configurable:true, enumerable:true, writable:true, value: function (){return ldvm.toolsFunc.dispatch(this, EventTarget.prototype, "EventTarget", "addEventListener", arguments)}});
ldvm.toolsFunc.defineProperty(EventTarget.prototype, "dispatchEvent", {configurable:true, enumerable:true, writable:true, value: function (){return ldvm.toolsFunc.dispatch(this, EventTarget.prototype, "EventTarget", "dispatchEvent", arguments)}});
ldvm.toolsFunc.defineProperty(EventTarget.prototype, "removeEventListener", {configurable:true, enumerable:true, writable:true, value: function (){return ldvm.toolsFunc.dispatch(this, EventTarget.prototype, "EventTarget", "removeEventListener", arguments)}});
ldvm.toolsFunc.defineProperty(EventTarget.prototype, "when", {configurable:true, enumerable:true, writable:true, value: function (){return ldvm.toolsFunc.dispatch(this, EventTarget.prototype, "EventTarget", "when", arguments)}});
