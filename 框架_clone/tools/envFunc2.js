!function () {    
    ldvm.envFunc.EventTarget_addEventListener = function EventTarget_addEventListener(type, listener, options) {
        // 这里可以添加一些日志或者其他操作
        // console.log(`调用了 addEventListener，类型是 ${type}`);
        return ;
    }
    
    ldvm.envFunc.Window_location_get = function Window_location_get() {
        
        return {
            "ancestorOrigins": {},
            "href": "https://y.qq.com/n/ryqq_v2/search?w=%E5%91%A8%E6%9D%B0%E4%BC%A6&t=song&remoteplace=txt.yqq.top",
            "origin": "https://y.qq.com",
            "protocol": "https:",
            "host": "y.qq.com",
            "hostname": "y.qq.com",
            "port": "",
            "pathname": "/n/ryqq_v2/search",
            "search": "?w=%E5%91%A8%E6%9D%B0%E4%BC%A6&t=song&remoteplace=txt.yqq.top",
            "hash": ""
        }
    };
    ldvm.envFunc.Navigator_userAgent_get = function Navigator_userAgent_get() {
        return 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/148.0.0.0 Safari/537.36 Edg/148.0.0.0'
    }
    ldvm.envFunc.Window_top_get = function Window_top_get() {
        return window;
    };
    ldvm.envFunc.Window_self_get = function Window_self_get() {
        return window;
    };
    ldvm.envFunc.Window_self_set = function Window_self_set(v) {
        // 模拟浏览器，不允许修改 self，或者直接忽略赋值
        //console.log("有人给 window.self 赋值了:", v);
        return true;
    };
    ldvm.envFunc.Window_parent_get = function Window_parent_get() {
        return window;
    };
    ldvm.envFunc.Window_parent_set = function Window_parent_set() {
        return window;
    };
}();