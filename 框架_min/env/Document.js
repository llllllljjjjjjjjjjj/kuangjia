

// Document对象
Document = function Document(){}
ldvm.toolsFunc.safeProto(Document, "Document");
Object.setPrototypeOf(Document.prototype, Node.prototype);
ldvm.toolsFunc.defineProperty(Document.prototype, "createElement", {configurable:true, enumerable:true, writable:true, value: function (){return ldvm.toolsFunc.dispatch(this, Document.prototype, "Document", "createElement", arguments)}});


