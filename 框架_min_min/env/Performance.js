Performance = function Performance(){ldvm.toolsFunc.throwError("TypeError", "Failed to construct 'Performance': Illegal constructor")}
ldvm.toolsFunc.safeProto(Performance, "Performance");
Object.setPrototypeOf(Performance.prototype, EventTarget.prototype);
performance = {};
Object.setPrototypeOf(performance, Performance.prototype); 
ldvm.toolsFunc.defineProperty(Performance.prototype, "now", {configurable:true, enumerable:true, writable:true, value: function (){return ldvm.toolsFunc.dispatch(this, Performance.prototype, "Performance", "now", arguments)}});
