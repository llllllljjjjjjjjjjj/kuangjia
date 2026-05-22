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
