// 全局变量初始化
!function () {
    let onEnter = function (obj) {
        try {
            // 直接调用 printLog 写入文件
            ldvm.toolsFunc.printLog(obj.args);
        }
        catch (e) { }
    }
    // 备份原生console.log（可选，如果你想同时保留控制台输出）
    const originalLog = console.log;
    console.log = ldvm.toolsFunc.hook(originalLog, undefined, false, onEnter, function () { }, true);
}();