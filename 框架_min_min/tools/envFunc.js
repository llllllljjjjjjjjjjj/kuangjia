//浏览器接口实现
!function () {
    ldvm.envFunc.Window_top_get = function Window_top_get() {
        return window;
    };
    ldvm.envFunc.Window_self_get = function Window_self_get() {
        return window;
    };
    ldvm.envFunc.Window_parent_set = function Window_parent_set() {
        return window;
    };
    ldvm.envFunc.Window_self_set = function Window_self_set() { return window; };
}()