const fetch = require("node-fetch");
const {parseHTML} = require('./tools_utils.js');
const { parentPort }  = require('worker_threads');

function getURL (intial){
    return new Promise(async(resolve, reject)=>{
        try{
            let data, stringifiedData = '';
            data = await fetch(intial);
            stringifiedData =  await data.text();
            resolve(stringifiedData);
        }
        catch(err){
            reject(err);
        }
    })
    
}

parentPort.on("message", (message) => {
    if(message.exit){
        process.exit(0)
    }
    getURL(message.url)
        .then((data)=>{
            parentPort.postMessage({currentURL: message.url, foundURL: parseHTML(data, message.url)});
        })
        .catch((err)=>{
            console.error(`Invalid URL provided: ${initialURL}\n${err}`);
            parentPort.postMessage({currentURL: initialURL, foundURL:[]});
        })
});