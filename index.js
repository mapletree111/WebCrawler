const { Worker, isMainThread, parentPort }  = require('worker_threads');
const fetch = require("node-fetch");
const cheerio = require('cheerio');

const knownList = [];
const newURLs = [];
const threads = new Set();

function updateListsOfURLs(arrayOfURLs){
    let lengthOfURLArray = (arrayOfURLs.length);
    if(lengthOfURLArray > 0){
        arrayOfURLs.forEach((item)=>{
            if(knownList.includes(item)){
                return;
            }
            else{
                knownList.push(item);
                newURLs.push(item);
            }
        });
    }
    return;
}

function prettyPrint(initialURL, listOfURLs){
    console.log(initialURL);
    if(listOfURLs.length !== 0){
        listOfURLs.forEach((item)=>{
            console.log(" ",item);
        });
    }
    return;
}

function parseHTML(data){
    let arrayURL = [];
    const $ = cheerio.load(data);
    $('a').each((i, link)=>{
        const href = link.attribs.href;
        if(href !== undefined){
            if(href.startsWith("https") || href.startsWith("http")){
                arrayURL.push(href);
            }
        }
    });
    return arrayURL;
}

async function fetchURL(url){
    let response = '';
    response = await fetch(url);
    return await response.text();
    
}

async function main(){
    let numThreads = 2;
    let commandArguments = process.argv.slice(2);
    if(commandArguments.length !== 1){
        console.error("Usage: npm start {URL}");
        return;
    }
    let data = '';
    try{
        data = await fetchURL(commandArguments[0])
    }
    catch(err){
        console.error(`Invalid URL provided: ${commandArguments[0]}\n${err}`);
        return;
    }
    
    let arrayURL = parseHTML(data);
    knownList.push(commandArguments[0]);
    prettyPrint(commandArguments[0], arrayURL);
    updateListsOfURLs(arrayURL)
    let firstURL = newURLs.shift();
    for(let i = 0; i < numThreads; i ++){
        threads.add(new Worker("./worker.js"));
    }
    for(let worker of threads){
        if(firstURL !== undefined){
            worker.postMessage({url:firstURL});
        }
        else{
            worker.postMessage({state:"StandBy"});
        }
        worker.on("error", (err) => {console.error("Something we wrong with one of the threads:", err)});
        worker.on('exit', ()=>{
            threads.delete(worker);
            console.log("Worker finish runninng");
        })
        worker.on('message', (message) => {
            if(message.state === "StandBy"){
                if(newURLs.length > 0){
                    let nextURL = newURLs.shift();
                    worker.postMessage({url:nextURL});
                }
            }
            else{
                prettyPrint(message.currentURL, message.foundURL);
                let workerFoundURL = message.foundURL;
                updateListsOfURLs(workerFoundURL);
                let nextURL = newURLs.shift();
                if(firstURL !== undefined){
                    worker.postMessage({url:nextURL});
                }
                else{
                    worker.postMessage({state:"StandBy"});
                }
            }
        });
    }
    
}

if (isMainThread) {
    main();
}

module.exports = {fetchURL, parseHTML, prettyPrint};
