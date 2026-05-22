//异步执行代
let loadEvent = ldvm.memory.asyncEvent.listener["load"];
if(loadEvent){    
    for(let i = 0; i < loadEvent.length; i++){
        let event = loadEvent[i];
        console.log("load事件：");
        //let type111 = event.type;
        let self = event.self;
        let listener = event.listener;
        let fakeEvent = {
            type: event.type,
            target: self,
            currentTarget: self,
            timeStamp: typeof performance !== 'undefined' ? performance.now() : Date.now()
        };
        listener.call(self, fakeEvent)
        
    }
}
// blur 事件
if (ldvm?.memory?.asyncEvent?.listener) {
    let blurEvent = ldvm.memory.asyncEvent.listener["blur"];
    if(blurEvent){
        for(let i = 0; i < blurEvent.length; i++){
            let event = blurEvent[i];
            console.log("blur事件：");
            //let type111 = event.type;
            let self = event.self;
            let listener = event.listener;
            let fakeEvent = {
                type: event.type,
                target: self,
                currentTarget: self,
                timeStamp: typeof performance !== 'undefined' ? performance.now() : Date.now()
            };
            listener?.call?.(self, fakeEvent);
        }
    }
}

// pagehide 事件
if (ldvm?.memory?.asyncEvent?.listener) {
    let pagehideEvent = ldvm.memory.asyncEvent.listener["pagehide"];
    if(pagehideEvent){
        for(let i = 0; i < pagehideEvent.length; i++){
            let event = pagehideEvent[i];
            console.log("pagehide事件：");
            //let type111 = event.type;
            let self = event.self;
            let listener = event.listener;
            let fakeEvent = {
                type: event.type,
                target: self,
                currentTarget: self,
                timeStamp: typeof performance !== 'undefined' ? performance.now() : Date.now()
            };
            listener?.call?.(self, fakeEvent);
        }
    }
}

// pageshow 事件
if (ldvm?.memory?.asyncEvent?.listener) {
    let pageshowEvent = ldvm.memory.asyncEvent.listener["pageshow"];
    if(pageshowEvent){
        for(let i = 0; i < pageshowEvent.length; i++){
            let event = pageshowEvent[i];
            console.log("pageshow事件：");
            //let type111 = event.type;
            let self = event.self;
            let listener = event.listener;
            let fakeEvent = {
                type: event.type,
                target: self,
                currentTarget: self,
                timeStamp: typeof performance !== 'undefined' ? performance.now() : Date.now()
            };
            listener?.call?.(self, fakeEvent);
        }
    }
}

// beforeunload 事件
if (ldvm?.memory?.asyncEvent?.listener) {
    let beforeunloadEvent = ldvm.memory.asyncEvent.listener["beforeunload"];
    if(beforeunloadEvent){
        for(let i = 0; i < beforeunloadEvent.length; i++){
            let event = beforeunloadEvent[i];
            console.log("beforeunload事件：");
            //let type111 = event.type;
            let self = event.self;
            let listener = event.listener;
            let fakeEvent = {
                type: event.type,
                target: self,
                currentTarget: self,
                timeStamp: typeof performance !== 'undefined' ? performance.now() : Date.now()
            };
            listener?.call?.(self, fakeEvent);
        }
    }
}

// resize 事件
if (ldvm?.memory?.asyncEvent?.listener) {
    let resizeEvent = ldvm.memory.asyncEvent.listener["resize"];
    if(resizeEvent){
        for(let i = 0; i < resizeEvent.length; i++){
            let event = resizeEvent[i];
            console.log("resize事件：");
            //let type111 = event.type;
            let self = event.self;
            let listener = event.listener;
            let fakeEvent = {
                type: event.type,
                target: self,
                currentTarget: self,
                timeStamp: typeof performance !== 'undefined' ? performance.now() : Date.now()
            };
            listener?.call?.(self, fakeEvent);
        }
    }
}

// scroll 事件
if (ldvm?.memory?.asyncEvent?.listener) {
    let scrollEvent = ldvm.memory.asyncEvent.listener["scroll"];
    if(scrollEvent){
        for(let i = 0; i < scrollEvent.length; i++){
            let event = scrollEvent[i];
            console.log("scroll事件：");
            //let type111 = event.type;
            let self = event.self;
            let listener = event.listener;
            let fakeEvent = {
                type: event.type,
                target: self,
                currentTarget: self,
                timeStamp: typeof performance !== 'undefined' ? performance.now() : Date.now()
            };
            listener?.call?.(self, fakeEvent);
        }
    }
}