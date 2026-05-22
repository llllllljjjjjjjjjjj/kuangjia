// Location对象
Location = function Location(){ldvm.toolsFunc.throwError("TypeError", "Failed to construct 'Location': Illegal constructor")}
ldvm.toolsFunc.safeProto(Location, "Location");
Object.setPrototypeOf(Location.prototype, Object.prototype);


// location对象
location = {};
Object.setPrototypeOf(location, Location.prototype); 
