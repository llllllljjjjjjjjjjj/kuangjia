// Location对象
Location = function Location(){ldvm.toolsFunc.throwError("TypeError", "Failed to construct 'Location': Illegal constructor")}
ldvm.toolsFunc.safeProto(Location, "Location");
Object.setPrototypeOf(Location.prototype, Object.prototype);


// location对象
location = {};
Object.setPrototypeOf(location, Location.prototype); 
ldvm.toolsFunc.defineProperty(location, "valueOf", {configurable:false, enumerable:false, writable:false, value: function (){return ldvm.toolsFunc.dispatch(this, location, "Location", "valueOf", arguments)}}); 
ldvm.toolsFunc.defineProperty(location, "ancestorOrigins", {configurable:false, enumerable:true, get: function (){return ldvm.toolsFunc.dispatch(this, location, "Location", "ancestorOrigins_get", arguments)},set:undefined}); 
ldvm.toolsFunc.defineProperty(location, "href", {configurable:false, enumerable:true, get: function (){return ldvm.toolsFunc.dispatch(this, location, "Location", "href_get", arguments)},set: function (){return ldvm.toolsFunc.dispatch(this, location, "Location", "href_set", arguments)}}); 
ldvm.toolsFunc.defineProperty(location, "origin", {configurable:false, enumerable:true, get: function (){return ldvm.toolsFunc.dispatch(this, location, "Location", "origin_get", arguments)},set:undefined}); 
ldvm.toolsFunc.defineProperty(location, "protocol", {configurable:false, enumerable:true, get: function (){return ldvm.toolsFunc.dispatch(this, location, "Location", "protocol_get", arguments)},set: function (){return ldvm.toolsFunc.dispatch(this, location, "Location", "protocol_set", arguments)}}); 
ldvm.toolsFunc.defineProperty(location, "host", {configurable:false, enumerable:true, get: function (){return ldvm.toolsFunc.dispatch(this, location, "Location", "host_get", arguments)},set: function (){return ldvm.toolsFunc.dispatch(this, location, "Location", "host_set", arguments)}}); 
ldvm.toolsFunc.defineProperty(location, "hostname", {configurable:false, enumerable:true, get: function (){return ldvm.toolsFunc.dispatch(this, location, "Location", "hostname_get", arguments)},set: function (){return ldvm.toolsFunc.dispatch(this, location, "Location", "hostname_set", arguments)}}); 
ldvm.toolsFunc.defineProperty(location, "port", {configurable:false, enumerable:true, get: function (){return ldvm.toolsFunc.dispatch(this, location, "Location", "port_get", arguments)},set: function (){return ldvm.toolsFunc.dispatch(this, location, "Location", "port_set", arguments)}}); 
ldvm.toolsFunc.defineProperty(location, "pathname", {configurable:false, enumerable:true, get: function (){return ldvm.toolsFunc.dispatch(this, location, "Location", "pathname_get", arguments)},set: function (){return ldvm.toolsFunc.dispatch(this, location, "Location", "pathname_set", arguments)}}); 
ldvm.toolsFunc.defineProperty(location, "search", {configurable:false, enumerable:true, get: function (){return ldvm.toolsFunc.dispatch(this, location, "Location", "search_get", arguments)},set: function (){return ldvm.toolsFunc.dispatch(this, location, "Location", "search_set", arguments)}}); 
ldvm.toolsFunc.defineProperty(location, "hash", {configurable:false, enumerable:true, get: function (){return ldvm.toolsFunc.dispatch(this, location, "Location", "hash_get", arguments)},set: function (){return ldvm.toolsFunc.dispatch(this, location, "Location", "hash_set", arguments)}}); 
ldvm.toolsFunc.defineProperty(location, "assign", {configurable:false, enumerable:true, writable:false, value: function (){return ldvm.toolsFunc.dispatch(this, location, "Location", "assign", arguments)}}); 
ldvm.toolsFunc.defineProperty(location, "reload", {configurable:false, enumerable:true, writable:false, value: function (){return ldvm.toolsFunc.dispatch(this, location, "Location", "reload", arguments)}}); 
ldvm.toolsFunc.defineProperty(location, "replace", {configurable:false, enumerable:true, writable:false, value: function (){return ldvm.toolsFunc.dispatch(this, location, "Location", "replace", arguments)}}); 
ldvm.toolsFunc.defineProperty(location, "toString", {configurable:false, enumerable:true, writable:false, value: function (){return ldvm.toolsFunc.dispatch(this, location, "Location", "toString", arguments)}}); 
