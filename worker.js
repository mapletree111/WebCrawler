const fetch = require("node-fetch");
const {parseHTML} = require('./tools_utils.js');
const { parentPort }  = require('worker_threads');

parentPort.on("message", async (message) => {
    if(message.exit){
        process.exit(0)
    }
    let initialURL = message.url;
    let data, stringifiedData = '';
    try{
        data = await fetch(initialURL);
        stringifiedData =  await data.text();
    }
    catch(err){
        console.error(`Invalid URL provided: ${initialURL}\n${err}`);
        parentPort.postMessage({currentURL: initialURL, foundURL:[]});
        process.exit(0);
    }
    let arrayURL = parseHTML(stringifiedData, message.url);
    parentPort.postMessage({currentURL: initialURL, foundURL:arrayURL});
    process.exit(0);
});