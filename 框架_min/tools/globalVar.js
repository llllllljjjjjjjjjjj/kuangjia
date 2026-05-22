//全局变量初始化
!function () {
    let onEnter = function (obj) {
        try {
            ldvm.toolsFunc.printLog(obj.args);
        }
        catch (e) {

        }


    }
    console.log = ldvm.toolsFunc.hook(
        console.log,
        undefined,
        false,
        onEnter,
        function () { },
        ldvm.config.print
    );
   

}();