// HTMLDivElement对象
HTMLDivElement = function HTMLDivElement(){ldvm.toolsFunc.throwError("TypeError", "Failed to construct 'HTMLDivElement': Illegal constructor")}
ldvm.toolsFunc.safeProto(HTMLDivElement, "HTMLDivElement");
Object.setPrototypeOf(HTMLDivElement.prototype, HTMLElement.prototype);
ldvm.toolsFunc.defineProperty(HTMLDivElement.prototype, "align", {configurable:true, enumerable:true, get: function (){return ldvm.toolsFunc.dispatch(this, HTMLDivElement.prototype, "HTMLDivElement", "align_get", arguments)},set: function (){return ldvm.toolsFunc.dispatch(this, HTMLDivElement.prototype, "HTMLDivElement", "align_set", arguments)}});