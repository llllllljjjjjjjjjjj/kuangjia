const fs = require("fs")
const path = require("path")

function getFile(name, type) {
    try {
        // 正确路径：回到上一级，进入 user/name/type.js
        const filePath = path.join(__dirname, "../user/" + name + "/" + type + ".js")
        return fs.readFileSync(filePath, 'utf8') + "\r\n"
    } catch (e) {
        console.log(filePath + " 不存在")
        return ""
    }
}

function getCode(name, type) {
    let code = "//用户代码\n"
    code += getFile(name, type)
    return code
}

module.exports = {
    getCode, getFile
}