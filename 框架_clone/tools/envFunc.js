//浏览器接口实现
!function () {
    ldvm.envFunc.EventTarget_addEventListener = function EventTarget_addEventListener() {
        let type = arguments[0];
        let listener = arguments[1];
        let options = arguments[2];
        console.log(`${this}添加了${type}事件监听`);
        let event = {
            "self": this,
            "type": type,
            "listener": listener,
            "options": options
        }
        // if(ldvm.memory.asyncEvent.listener === undefined) {
        //     ldvm.memory.asyncEvent.listener = {};
        // }
        if(ldvm.memory.asyncEvent.listener[type] === undefined) {
            ldvm.memory.asyncEvent.listener[type] = [];
        }
        ldvm.memory.asyncEvent.listener[type].push(event);
    }
    ldvm.envFunc.HTMLElement_offsetHeight_get = function HTMLElement_offsetHeight_get() {
        //先拿到字体---是否可以识别
        let fontFamily = this.style.fontFamily;
        if (ldvm.memory.globalVar.fontList.indexOf(fontFamily) !== -1) {
            //可以识别
            return 666;
        } else {//不可识别
            return 999;
        }
    }

    ldvm.envFunc.HTMLElement_offsetWidth_get = function HTMLElement_offsetWidth_get() {
        let fontFamily = this.style.fontFamily;
        if (ldvm.memory.globalVar.fontList.indexOf(fontFamily) !== -1) {
            return 1666;
        } else {
            return 1999;
        }
    }

    ldvm.envFunc.Element_children_get = function Element_children_get() {
        return ldvm.toolsFunc.getProtoArr.call(this, "children");
    }
    ldvm.envFunc.Node_appendChild = function Node_appendChild() {
        let tag = arguments[0];
        let collection = [];
        collection.push(tag);

        ldvm.toolsFunc.createProxyObj(collection, HTMLCollection, "collection");
        //添加是可能对很多属性有改变，但是暂时先对应上一个
        ldvm.toolsFunc.setProtoArr.call(this, "children", collection);
    }
    ldvm.envFunc.Document_body_get = function Document_body_get() {
        let collection = ldvm.toolsFunc.getCollection('[object HTMLBodyElement]');
        return collection[0]
    }

    ldvm.envFunc.Element_innerHTML_set = function Element_innerHTML_set() {
        let htmlStr = arguments[0];
        //设置字体属性的位置
        let style = {
            "font-family": "mmll",
            "font-size": "160px",
            "fontFamily": "mmll"
        }
        //具体情况自己实现
        //例子<span lang="zh" style="font-family:mmll;font-size:160px">fontTest</span>
        let tagJson = {
            "type": "span",
            "prop": {
                "lang": "zh",
                "style": style,
                "textContent": "fontTest"
            }
        }
        let span = document.createElement(tagJson["type"]);
        for (const key in tagJson["prop"]) {
            ldvm.toolsFunc.setProtoArr.call(span, key, tagJson["prop"][key]);
        }
    }

    ldvm.envFunc.WebGLRenderingContext_canvas_get = function WebGLRenderingContext_canvas_get() {
        return ldvm.toolsFunc.getProtoArr.call(this, "canvas");
    }
    ldvm.envFunc.WebGLRenderingContext_createProgram = function WebGLRenderingContext_createProgram() {
        let program = {};
        program = ldvm.toolsFunc.createProxyObj(program, WebGLProgram, "program");
        return program;
    }
    ldvm.envFunc.WebGLRenderingContext_createBuffer = function WebGLRenderingContext_createBuffer() {
        let buffer = {}
        buffer = ldvm.toolsFunc.createProxyObj(buffer, WebGLBuffer, "buffer")
    }

    ldvm.envFunc.HTMLCanvasElement_toDataURL = function HTMLCanvasElement_toDataURL() {
        let type = ldvm.toolsFunc.getProtoArr.call(this, "type", type)
        if (type === "2d") {
            return ldvm.memory.globalVar.canvas_2d;
        } else if (type === "webgl") {
            return ldvm.memory.globalVar.canvas_webgl
        }


    }
    ldvm.envFunc.HTMLCanvasElement_getContext = function HTMLCanvasElement_getContext() {
        let type = arguments[0];
        let context = {};
        switch (type) {
            case "2d":
                context = ldvm.toolsFunc.createProxyObj(context, CanvasRenderingContext2D, "context_2d");
                ldvm.toolsFunc.createProxyObj(context, "canvas", this)
                ldvm.toolsFunc.setProtoArr.call(this, "type", type)
                break;
            case "webgl":
                context = ldvm.toolsFunc.createProxyObj(context, WebGLRenderingContext, "context_webgl");
                ldvm.toolsFunc.createProxyObj(context, "canvas", this)
                ldvm.toolsFunc.setProtoArr.call(this, "type", type)

                break;

            default:
                console.log(`HTMLCanvasElement_getContext_${type}未实现`);
                break;
        }
        return context;
    }
    ldvm.envFunc.HTMLElement_style_get = function HTMLElement_style_get() {
        let style = {};
        style = ldvm.toolsFunc.createProxyObj(style, CSSStyleDeclaration, "")
    }
    ldvm.envFunc.HTMLCanvasElement_width_set = function HTMLCanvasElement_width_set() {
    }

    ldvm.envFunc.HTMLCanvasElement_height_set = function HTMLCanvasElement_height_set() {
    }
    ldvm.envFunc.Plugin_namedItem = function Plugin_namedItem() {
        let name = arguments[0];
        return this[name];
    }

    ldvm.envFunc.Plugin_item = function Plugin_item() {
        let index = arguments[0];
        return this[index];
    }
    ldvm.envFunc.MimeTypeArray_namedItem = function MimeTypeArray_namedItem() {
        let name = arguments[0];
        return this[name];
    }

    ldvm.envFunc.MimeTypeArray_item = function MimeTypeArray_item() {
        let index = arguments[0];
        return this[index];
    }

    ldvm.envFunc.PluginArray_namedItem = function PluginArray_namedItem() {
        let name = arguments[0];
        return this[name];
    }

    ldvm.envFunc.PluginArray_item = function PluginArray_item() {
        let index = arguments[0];
        return this[index];
    }

    ldvm.envFunc.Plugin_description_get = function Plugin_description_get() {
        return ldvm.toolsFunc.getProtoArr.call(this, "description");
    }

    ldvm.envFunc.Plugin_filename_get = function Plugin_filename_get() {
        return ldvm.toolsFunc.getProtoArr.call(this, "filename");
    }

    ldvm.envFunc.Plugin_length_get = function Plugin_length_get() {
        return ldvm.toolsFunc.getProtoArr.call(this, "length");
    }

    ldvm.envFunc.MimeType_suffixes_get = function MimeType_suffixes_get() {
        return ldvm.toolsFunc.getProtoArr.call(this, "suffixes");
    }

    ldvm.envFunc.MimeType_enabledPlugin_get = function MimeType_enabledPlugin_get() {
        return ldvm.toolsFunc.getProtoArr.call(this, "enabledPlugin");
    }
    ldvm.envFunc.MimeTypeArray_length_get = function MimeTypeArray_length_get() {
        return ldvm.toolsFunc.getProtoArr.call(this, "length");
    }

    ldvm.envFunc.MimeType_type_get = function MimeType_type_get() {
        return ldvm.toolsFunc.getProtoArr.call(this, "type");
    }

    ldvm.envFunc.PluginArray_length_get = function PluginArray_length_get() {
        return ldvm.toolsFunc.getProtoArr.call(this, "length");
    }

    ldvm.envFunc.Plugin_name_get = function Plugin_name_get() {
        return ldvm.toolsFunc.getProtoArr.call(this, "name");
    }
    ldvm.envFunc.Navigator_mimeTypes_get = function Navigator_mimeTypes_get() {
        return ldvm.memory.globalVar.mimeTypeArray;
    }

    ldvm.envFunc.Navigator_plugins_get = function Navigator_plugins_get() {
        return ldvm.memory.globalVar.pluginArray
    }

    ldvm.envFunc.HTMLInputElement_value_get = function HTMLInputElement_value_get() {
        return ldvm.toolsFunc.getProtoArr.call(this, "value");
    }

    ldvm.envFunc.HTMLInputElement_value_set = function HTMLInputElement_value_set() {
        let value = arguments[0];
        ldvm.toolsFunc.setProtoArr.call(this, "value", value);
    }
    ldvm.envFunc.HTMLInputElement_name_get = function HTMLInputElement_name_get() {
        return ldvm.toolsFunc.getProtoArr.call(this, "name");
    }

    ldvm.envFunc.HTMLInputElement_name_set = function HTMLInputElement_name_set() {
        let value = arguments[0];
        ldvm.toolsFunc.setProtoArr.call(this, "name", value);
    }
    ldvm.envFunc.Element_id_get = function Element_id_get() {
        return ldvm.toolsFunc.getProtoArr.call(this, "id");
    }
    ldvm.envFunc.Element_id_set = function Element_id_set() {
        let id = arguments[0]
        ldvm.toolsFunc.setProtoArr.call(this, "id", id);
    }
    ldvm.envFunc.HTMLInputElement_type_set = function HTMLInputElement_type_set() {
        let value = arguments[0];
        ldvm.toolsFunc.setProtoArr.call(this, "type", value)
    }
    ldvm.envFunc.HTMLInputElement_type_get = function HTMLInputElement_type_get() {
        return ldvm.toolsFunc.getProtoArr.call(this, "type");
    }


    ldvm.envFunc.Node_removeChild = function Node_removeChild() {
    }


    ldvm.envFunc.Node_parentNode_get = function Node_parentNode_get() {
        return ldvm.toolsFunc.getProtoArr.call(this, "parentNode");
    }


    ldvm.envFunc.HTMLMetaElement_content_get = function HTMLMetaElement_content_get() {
        return ldvm.toolsFunc.getProtoArr.call(this, "content");
    }
    ldvm.envFunc.HTMLMetaElement_content_set = function HTMLMetaElement_content_set() {
        let value = arguments[0];
        return ldvm.toolsFunc.setProtoArr.call(this, "content", value);
    }


    ldvm.envFunc.HTMLDivElement_align_get = function HTMLDivElement_align_get() {
        return ldvm.toolsFunc.getProtoArr.call(this, "align");
    }
    ldvm.envFunc.HTMLDivElement_align_set = function HTMLDivElement_align_set() {
        let value = arguments[0];
        return ldvm.toolsFunc.setProtoArr.call(this, "align", value);
    }
    //只实现了div、meta、canvas、head、input、canvas、a
    ldvm.envFunc.Document_createElement = function Document_createElement() {
        let tagName = arguments[0].toLowerCase();
        let options = arguments[1];
        let tag = {};
        switch (tagName) {
            case "div":
                //设置实例对象的原型与代理    
                tag = ldvm.toolsFunc.createProxyObj(tag, HTMLDivElement, `${tagName}`);
                ldvm.memory.tag.push(tag);
                break;
            case "meta":
                tag = ldvm.toolsFunc.createProxyObj(tag, HTMLMetaElement, `${tagName}`);
                ldvm.memory.tag.push(tag);
                break
            case "head":
                tag = ldvm.toolsFunc.createProxyObj(tag, HTMLHeadElement, `${tagName}`);
                ldvm.memory.tag.push(tag);
                break
            case "input":
                tag = ldvm.toolsFunc.createProxyObj(tag, HTMLInputElement, `${tagName}`);
                ldvm.memory.tag.push(tag);
                break
            case "a":
                tag = ldvm.toolsFunc.createProxyObj(tag, HTMLAnchorElement, `${tagName}`);
                ldvm.memory.tag.push(tag)
            case "canvas":
                tag = ldvm.toolsFunc.createProxyObj(tag, HTMLCanvasElement, `${tagName}`)
                ldvm.memory.tag.push(tag)
            case "body":
                tag = ldvm.toolsFunc.createProxyObj(tag, HTMLBodyElement, `${tagName}`)
                ldvm.memory.tag.push(tag)
            case "span":
                tag = ldvm.toolsFunc.createProxyObj(tag, HTMLSpanElement, `${tagName}`)
                ldvm.memory.tag.push(tag)







            default:
                console.log(`Document_createElement_${tagName}未实现`);
                break;
        }
        return tag;
    }
    //只实现了meta
    ldvm.envFunc.Document_getElementsByTagName = function Document_getElementsByTagName() {
        let tagName = arguments[0].toLowerCase();
        let collection = []
        switch (tagName) {
            case "meta":
                collection = ldvm.toolsFunc.getCollection('[object HTMLMetaElement]');
                collection = ldvm.toolsFunc.createProxyObj(collection, HTMLCollection, `Document_getElementsByTagName_${tagName}`)
                break;
            default:
                console.log(`Document_getElementsByTagName_${tagName}未实现`);
                break;
        }
        return collection
    }
    ldvm.envFunc.Document_write = function Document_write() {
        let tagStr = arguments[0];
        let tagJson = ldvm.toolsFunc.getTagJson(tagStr)
        let tag = document.createElement(tagJson.type);
        for (const key in tagJson.prop) {
            //如果没有设置进去我们自己的API--setProtoArr设置
            tag[key] = tagJson.prop[key];
            if (tag[key] === undefined) {
                ldvm.toolsFunc.setProtoArr.call(tag, key, tagJson.prop[key]);
            }
        }
    };
    //返回同类标签中对应ID的标签
    ldvm.envFunc.Document_getElementById = function Document_getElementById() {
        let id = arguments[0];
        let tags = ldvm.memory.tag;
        for (let i = 0; i < tags.length; i++) {
            if (tags[i].id === id) {
                return tags[i];
            }
        }
        return null;
    };
    ldvm.envFunc.Document_cookie_get = function Document_cookie_get() {
        let jsonCookie = ldvm.memory.globalVar.jsonCookie;
        let tempCookie = ""
        for (const key in jsonCookie) {
            if (key === "") {
                tempCookie += `${jsonCookie[key]}; `

            }
            else {
                tempCookie += `${key}=${jsonCookie[key]}; `

            }
        }
        return tempCookie
    }
    ldvm.envFunc.Document_cookie_set = function Document_cookie_set() {
        let cookieValue = arguments[0];
        let index = cookieValue.indexOf(";");
        if (index !== -1) {
            cookieValue = cookieValue.substring(0, index)
        }
        if (cookieValue.indexOf("=") === -1) {
            ldvm.memory.globalVar.jsonCookie[""] = cookieValue.trim();
        } else {
            let item = cookieValue.split("=");
            let k = item[0];
            let v = item[1];
            ldvm.memory.globalVar.jsonCookie[k] = v;
        }
    }
    ldvm.envFunc.Window_top_get = function Window_top_get() {
        return window;
    };
    ldvm.envFunc.Window_self_get = function Window_self_get() {
        return window;
    };
    ldvm.envFunc.Window_parent_set = function Window_parent_set() {
        return window;
    };
    ldvm.envFunc.Window_self_set = function Window_self_set() { return window; };
    ldvm.envFunc.Storage_getItem = function Storage_getItem() {
        let keyname = arguments[0]
        let valuename = arguments[1]
        if (keyname in Storage) {
            return this[keyname]
        }
        return null
    }
    ldvm.envFunc.Storage_setItem = function Storage_setItem() {
        let keyname = arguments[0]
        let valuename = arguments[1]
        this[keyname] = valuename
        return null
    }
    ldvm.envFunc.Storage_key = function Storage_key() {
        let index = arguments[0];
        let i = 0;
        for (const key in this) {
            if (i === index) {
                return key;
            }
            i++;
        }
        return null
    }
    ldvm.envFunc.Storage_clear = function Storage_clear() {
        for (const key in this) {
            delete this[key];
        }
    }
    ldvm.envFunc.Storage_length_get = function Storage_length_get() {
        let i = 0;
        for (const key in Object.getOwnPropertyDescriptors(this)) {
            i++;
        }
        return i;
    }
    ldvm.envFunc.removeItem = function removeItem() {
        let keyname = arguments[0]
        delete this[keyname]
        return null

    }
}()