// MimeType对象
MimeType = function MimeType(){ldvm.toolsFunc.throwError("TypeError", "Failed to construct 'MimeType': Illegal constructor")}
ldvm.toolsFunc.safeProto(MimeType, "MimeType");
Object.setPrototypeOf(MimeType.prototype, Object.prototype);
ldvm.toolsFunc.defineProperty(MimeType.prototype, "type", {configurable:true, enumerable:true, get: function (){return ldvm.toolsFunc.dispatch(this, MimeType.prototype, "MimeType", "type_get", arguments)},set:undefined});
ldvm.toolsFunc.defineProperty(MimeType.prototype, "suffixes", {configurable:true, enumerable:true, get: function (){return ldvm.toolsFunc.dispatch(this, MimeType.prototype, "MimeType", "suffixes_get", arguments)},set:undefined});
ldvm.toolsFunc.defineProperty(MimeType.prototype, "description", {configurable:true, enumerable:true, get: function (){return ldvm.toolsFunc.dispatch(this, MimeType.prototype, "MimeType", "description_get", arguments)},set:undefined});
ldvm.toolsFunc.defineProperty(MimeType.prototype, "enabledPlugin", {configurable:true, enumerable:true, get: function (){return ldvm.toolsFunc.dispatch(this, MimeType.prototype, "MimeType", "enabledPlugin_get", arguments)},set:undefined});
