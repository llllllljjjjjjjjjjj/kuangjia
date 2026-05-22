Storage = function Storage(){ldvm.toolsFunc.throwError("TypeError", "Failed to construct 'Storage': Illegal constructor")}
ldvm.toolsFunc.safeProto(Storage, "Storage");
Object.setPrototypeOf(Storage.prototype, Object.prototype);
localStorage = {};
Object.setPrototypeOf(localStorage, Storage.prototype); 
sessionStorage = {};
Object.setPrototypeOf(sessionStorage, Storage.prototype); 
