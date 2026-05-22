// HTMLCollection对象
HTMLCollection = function HTMLCollection(){ldvm.toolsFunc.throwError("TypeError", "Failed to construct 'HTMLCollection': Illegal constructor")}
ldvm.toolsFunc.safeProto(HTMLCollection, "HTMLCollection");
Object.setPrototypeOf(HTMLCollection.prototype, Object.prototype);
ldvm.toolsFunc.defineProperty(HTMLCollection.prototype, "length", {configurable:true, enumerable:true, get: function (){return ldvm.toolsFunc.dispatch(this, HTMLCollection.prototype, "HTMLCollection", "length_get", arguments)},set:undefined});
ldvm.toolsFunc.defineProperty(HTMLCollection.prototype, "item", {configurable:true, enumerable:true, writable:true, value: function (){return ldvm.toolsFunc.dispatch(this, HTMLCollection.prototype, "HTMLCollection", "item", arguments)}});
ldvm.toolsFunc.defineProperty(HTMLCollection.prototype, "namedItem", {configurable:true, enumerable:true, writable:true, value: function (){return ldvm.toolsFunc.dispatch(this, HTMLCollection.prototype, "HTMLCollection", "namedItem", arguments)}});
