const { Worker, isMainThread } = require("worker_threads");
const fetch = require("node-fetch");
const cheerio = require("cheerio");
const yargs = require("yargs");
const { option } = require("yargs");

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

function closeEverything(){
    for(let worker of threads){
        worker.postMessage({exit:true});
    }
}

async function main(){
    let workerWaiting = 0;
    let numThreads = 1;
    let setTimer = 300;
    const options = yargs
        .usage("Usage: -u <url>")
        .option("u",{ alias: "url", describe: "Link/URL to start crawling from", type: "string", demandOption: true })
        .option("n",{ alias: "threads", describe: "Indicates the number of threads to use (default: 1)", type: "number", demandOption: false})
        .option("t",{ alias: "time", describe: "Sets a timer for when to stop (sec) (default: 300sec) (0 - run forever)", type: "number", demandOption: false})
        .argv;
    if(options.time){
        if(options.time < 0){
            console.error("Error: Number of seconds cannot be lower than 0");
            return;
        }
        setTimer = options.time
    }
    if(setTimer){
        setTimeout(closeEverything, (setTimer*100));
    }
    if(options.threads){
        if(options.threads <= 0){
            console.error("Error: Number of threads cannot be lower than 1");
            return;
        }
        numThreads = options.threads;
    }
    let commandArguments = options.url;
    let data = '';
    try{
        data = await fetchURL(commandArguments)
    }
    catch(err){
        console.error(`Error: Invalid URL provided: ${commandArguments}\n${err}`);
        return;
    }
    
    let arrayURL = parseHTML(data);
    knownList.push(commandArguments);
    prettyPrint(commandArguments, arrayURL);
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
        worker.on("error", (err) => {console.error("Error: Something we wrong with one of the threads:", err)});
        worker.on('exit', ()=>{
            threads.delete(worker);
            if(threads.size === 0){
                console.log("Finished!");
                process.exit(0);
            }
        })
        worker.on('message', (message) => {
            if(message.state === "StandBy"){
                if(newURLs.length > 0){
                    let nextURL = newURLs.shift();
                    worker.postMessage({url:nextURL});
                }
                else{
                    workerWaiting++;
                    if(workerWaiting === 3){
                        workerWaiting = 0;
                        worker.postMessage({exit:true});
                    }
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
