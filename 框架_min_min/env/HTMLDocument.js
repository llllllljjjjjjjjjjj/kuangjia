HTMLDocument = function HTMLDocument(){ldvm.toolsFunc.throwError("TypeError", "Failed to construct 'HTMLDocument': Illegal constructor")}
ldvm.toolsFunc.safeProto(HTMLDocument, "HTMLDocument");
Object.setPrototypeOf(HTMLDocument.prototype, Document.prototype);
document = {};
Object.setPrototypeOf(document,HTMLDocument.prototype );
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
ldvm.toolsFunc.defineProperty(Document.prototype, "documentElement", {configurable:true, enumerable:true, get: function (){return ldvm.toolsFunc.dispatch(this, Document.prototype, "Document", "documentElement_get", arguments)},set:undefined});

