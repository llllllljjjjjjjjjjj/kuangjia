!function () {

    // 安全的对象转字符串（兼容循环引用）
    const safeStringify = (obj) => {
        const seen = new WeakSet();
        return JSON.stringify(obj, (key, value) => {
            if (typeof value === 'object' && value !== null) {
                if (seen.has(value)) return '[Circular Reference]';
                seen.add(value);
            }
            return value;
        }, 2);
    };

    ldvm.toolsFunc.printLog = function printLog(logList) {
        let log = "";
        for(let i=0; i<logList.length; i++){
            const item = logList[i];
            if (typeof item === "function") {
                log += item.toString() + " ";
            } else if (typeof item === "object" && item !== null) {
                log += safeStringify(item) + " ";
            } else if (typeof item === "symbol") {
                log += item.toString() + " ";
            } else {
                log += String(item) + " ";
            }
            log += "\r\n";
        }

        const logDir = path.join(__dirname, "user", _name_);
        const logPath = path.join(logDir, "log.txt");
        
        try {
            //递归创建目录，不存在就创建，存在不报错;沙箱必备：避免目录不存在导致写入失败
            fs.mkdirSync(logDir, { recursive: true });
            //同步写入，简单稳定;追加模式，不覆盖历史日志
            fs.appendFileSync(logPath, log, "utf8");
        } catch (e) {}
    }
}();