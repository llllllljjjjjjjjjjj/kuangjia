const fs = require("fs")
const path = require("path")
const vm = require("vm"); // 用 Node.js 原生 vm，不依赖任何第三方库
const user = require("./config/user.config.js")
const tools = require("./config/tools.config.js")
const env = require("./config/env.config.js")
const name = "test"
debugger
//清空日志
fs.writeFileSync(path.join(__dirname, "user", name, "log.txt"), "")

// ✅ 用 Node.js 原生 vm 创建上下文，Proxy 原生支持，不会被限制
const vm1 = vm.createContext({
    fs,
    _name_: name,
    path,
    __dirname: __dirname,
    Proxy, // 直接把原生 Proxy 注入上下文
    Reflect
});

// 全部使用绝对路径，不会错
const configCode = fs.readFileSync(path.join(__dirname, "config/config.js"), 'utf8')
const toolsCode = tools.getCode()
const envCode = env.getCode()
const globalVarCode = tools.getFile("globalVar")
const userVarCode = user.getCode(name, "userVar")
const proxyObjCode = tools.getFile("proxyObj")
const debugCode = user.getCode(name, "input")
const asynCode = user.getCode(name, "async")

const code = [
    configCode,
    toolsCode,
    envCode,
    globalVarCode,
    userVarCode,
    proxyObjCode,
    debugCode,
    asynCode
].join("\n")
const codeTest = [
    `const _name_ = "${name}";`,
    configCode,
    toolsCode,
    fs.readFileSync(path.join(__dirname, "tools", "printLog.js"), "utf8"), 
    envCode,
    globalVarCode,
    userVarCode,
    proxyObjCode,
    debugCode,
    asynCode
].join("\n")

// ✅ 用原生 vm 运行代码，Proxy 100% 可用
//const result = vm.runInContext(codeTest, vm1, {filename: "./debugJS.js"})

// 输出目录也正确
const outputPath = path.join(__dirname, "user", name, "output.js")
fs.writeFileSync(outputPath, code, 'utf8')

console.log("执行成功！文件已输出到：" + outputPath)