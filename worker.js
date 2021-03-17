const fetch = require("node-fetch");
const {parseHTML} = require('./tools_utils.js');
const { parentPort }  = require('worker_threads');
const {AbortController} = require("abort-controller");

/**
 * Called by workers to obtain a stringified version of the DOM from the
 * URL sented by main thread
 *
 * @param {string} initial - contains the url that will be used to fetch the DOM from
 * @return {Promise} resolves - a stringified version of the fetch URL DOM
 */

function getURL (intial){
    return new Promise(async(resolve, reject)=>{
        try{
            const timeout = 5000;
            const controller = new AbortController();
            const id = setTimeout(() =>{
                controller.abort()
            }, timeout);
            let data, stringifiedData = '';
            data = await fetch(intial, {signal: controller.signal});
            clearTimeout(id);
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
            console.error(`Invalid URL provided: ${message.url}\n${err}`);
            parentPort.postMessage({currentURL: message.url, foundURL:[]});
        })
});