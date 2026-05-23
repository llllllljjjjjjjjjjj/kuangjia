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
        for (let i = 0; i < logList.length; i++) {
            const item = logList[i];
            if (typeof item === "function") {
                log += item.toString() + " ";
            } else if (typeof item === "object" && item !== null) {
                try {
                    const seen = new WeakSet();
                    log += JSON.stringify(item, (k, v) => {
                        if (typeof v === 'object' && v !== null) {
                            if (seen.has(v)) return '[Circular]';
                            seen.add(v);
                        }
                        return v;
                    }, 2) + " ";
                } catch (e) {
                    log += '[Circular] ';
                }
            } else if (typeof item === "symbol") {
                log += item.toString() + " ";
            } else {
                log += String(item) + " ";
            }
            log += "\r\n";
        }

        try {
            fs.appendFileSync("log.txt", log, "utf8");
        } catch (e) {
            console.error("写入失败:", e);
        }
    };
}();