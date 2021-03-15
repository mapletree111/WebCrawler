const fetch = require("node-fetch");
const {parseHTML} = require('./tools_utils.js');
const { parentPort }  = require('worker_threads');

let standBy;

parentPort.on("message", async (message) => {
    if(message.exit){
        process.exit(0);
    }
    else if(message.state === "StandBy"){
        standBy = setInterval(()=>{
            parentPort.postMessage({state:"StandBy"});
        }, 5000);
    }
    else{
        clearInterval(standBy);
        let initialURL = message.url;
        let data, stringifiedData = '';
        try{
            data = await fetch(initialURL);
            stringifiedData =  await data.text();
        }
        catch(err){
            console.error(`Invalid URL provided: ${initialURL}\n${err}`);
            parentPort.postMessage({currentURL: initialURL, foundURL:[]});
        }
        let arrayURL = parseHTML(stringifiedData);
        parentPort.postMessage({currentURL: initialURL, foundURL:arrayURL});
    }
});