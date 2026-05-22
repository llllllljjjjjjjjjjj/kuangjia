const fs = require("fs")
const path = require("path")

function getFile(name) {
    let filePath = path.join(__dirname, "../env/" + name + ".js");
    try {
        // 正确路径：回到上一级，进入 env 目录
        return fs.readFileSync(filePath, 'utf8') + "\r\n"
    } catch (e) {
        console.log(filePath + " 不存在")
        return ""
    }
}
function getHtmlElement(){
    const filePath1 = path.join(__dirname, "../env/" + "htmlElements")
    
    try{
        let code = "";
        let fileList = fs.readdirSync(filePath1, 'utf-8');
        for (let i = 0; i < fileList.length; i++) {
            const filePath2 = path.join(__dirname, "../env" + "/htmlElements" + `/${fileList[i]}`)
            code += fs.readFileSync(filePath2, 'utf-8') + "\r\n";
        }
        return code;
    }catch (e){
        console.log(`./env/${name}.js不存在`);
        return "";
    }
}
function getCode(name, type) {
    let code = "//env相关代码\n"
    //越上层的放上面
    // window/document/location/history/navigator/staorage
    code += getFile("EventTarget")
    code += getFile("WindowProperties")
    code += getFile("Window")
    code += getFile("Node")
    code += getFile("Element")
    code += getFile("Document")
    code += getFile("HTMLDocument")
    code += getFile("Navigator")
    code += getFile("Storage")
    code += getFile("Location")
    code += getFile("History") 
    code += getFile("Performance")
    code += getFile("Screen")
    code += getFile('chrome')
    code += getFile("globalThis")//全局环境
    return code
}

module.exports = {
    getCode, getFile
}