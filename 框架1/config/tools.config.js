const fs = require("fs")
const path = require("path")

function getFile(name) {
    try {
        // 正确路径：回到上一级，进入 tools 目录
        const filePath = path.join(__dirname, "../tools/" + name + ".js")
        return fs.readFileSync(filePath, 'utf8') + "\r\n"
    } catch (e) {
        console.log(filePath + " 不存在")
        return ""
    }
}

function getCode(name, type) {
    let code = "//工具函数代码\n"
    code += getFile("toolsFunc")
    code += getFile("envFunc")
    return code
}

module.exports = {
    getCode, getFile
}