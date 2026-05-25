!function () {
    // 提前备份原生console方法，避免被代理污染
    const originalLog = console.log.bind(console);
    const originalError = console.error.bind(console);

    const onEnter = function (obj) {
        try {
            ldvm.toolsFunc.printLog(obj.args);
        } catch (e) {
            originalError("日志处理异常:", e);
        }
    };

    // 基于原生方法hook，保留控制台正常输出
    console.log = ldvm.toolsFunc.hook(originalLog, undefined, false, onEnter, function () {}, true);
}();