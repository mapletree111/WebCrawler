const fetch = require("node-fetch");
const {parseHTML} = require('./tools_utils.js');
const { parentPort }  = require('worker_threads');

let standBy;

parentPort.on("message", async (message) => {
    let initialURL = message.url.link;
    let data, stringifiedData = '';
    try{
        data = await fetch(initialURL);
        stringifiedData =  await data.text();
    }
    catch(err){
        console.error(`Invalid URL provided: ${initialURL}\n${err}`);
        parentPort.postMessage({currentURL: initialURL, foundURL:[]});
    }
    let arrayURL = parseHTML(stringifiedData, message.url.depth);
    parentPort.postMessage({currentURL: initialURL, foundURL:arrayURL});
});