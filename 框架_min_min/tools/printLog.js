!function () {
    // 安全序列化：兼容循环引用+过滤代理内部私有属性
    const safeStringify = (obj) => {
        const seen = new WeakSet();
        return JSON.stringify(obj, (key, value) => {
            // 过滤代理内部的Symbol标记，避免输出无关内容
            if (typeof key === 'symbol' || key === ldvm.memory.symbolProxy || key === ldvm.memory.symbolData) {
                return undefined;
            }
            if (typeof value === 'object' && value !== null) {
                if (seen.has(value)) return '[Circular Reference]';
                seen.add(value);
            }
            return value;
        });
    };

    ldvm.toolsFunc.printLog = function printLog(logList) {
        const logParts = [];
        for (let i = 0; i < logList.length; i++) {
            const item = logList[i];
            if (typeof item === "function") {
                logParts.push(item.toString());
            } else if (typeof item === "object" && item !== null) {
                try {
                    logParts.push(safeStringify(item));
                } catch (e) {
                    logParts.push('[Object Circular]');
                }
            } else if (typeof item === "symbol") {
                logParts.push(item.toString());
            } else {
                logParts.push(String(item));
            }
        }
        // 还原console原生格式：参数空格分隔，单次调用仅末尾加一次换行
        const log = logParts.join(' ') + "\r\n";

        try {
            fs.appendFileSync("log.txt", log, "utf8");
        } catch (e) {
            // 避免循环调用console，直接用标准错误输出
            process.stderr.write("日志写入失败: " + e.message + "\r\n");
        }
    };
}();