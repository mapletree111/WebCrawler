const {fetchURL, parseHTML} = require('./index.js');
const { parentPort }  = require('worker_threads');

let standBy;

parentPort.on("message", async (message) => {
    if(message.state === "StandBy"){
        standBy = setInterval(()=>{
            parentPort.postMessage({state:"StandBy"});
        }, 5000);
    }
    else{
        clearInterval(standBy);
        let initialURL = message.url;
        let data = '';
        try{
            data = await fetchURL(initialURL);
        }
        catch(err){
            console.error(`Invalid URL provided: ${initialURL}\n${err}`);
            parentPort.postMessage({currentURL: initialURL, foundURL:[]});
        }
        let arrayURL = parseHTML(data);
        parentPort.postMessage({currentURL: initialURL, foundURL:arrayURL});
    }
});