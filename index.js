const { Worker, isMainThread } = require("worker_threads");
const fetch = require("node-fetch");
const yargs = require("yargs");
const {parseHTML, prettyPrint, updateListsOfURLs} = require('./tools_utils.js');
const { option } = require("yargs");

const threads = new Set();
/**
 * Function that setTimeout will call to end program if set
 *
 * @param none
 * @return none
 */
function closeEverything(){
    for(let worker of threads){
        worker.postMessage({exit:true});
    }
}

/**
 * Main thread taking in commandline arguments, stepping
 * through first iteration of web-crawler, and controls the
 * worker threads
 *
 * @param none
 * @return none
 */
async function main(){
    let workerWaiting = 0;
    let numThreads = 1;
    let setTimer = 300;
    const knownList = [];
    const newURLs = [];
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
        if(options.threads <= 1){
            console.error("Error: Number of threads cannot be lower than 1");
            return;
        }
        numThreads = options.threads;
    }
    let commandArguments = options.url;
    let data, stringifiedData = '';
    try{
        data = await fetch(commandArguments)
        stringifiedData =  await data.text();

    }
    catch(err){
        console.error(`Error: Invalid URL provided: ${commandArguments}\n${err}`);
        return;
    }
    
    let arrayURL = parseHTML(stringifiedData);
    knownList.push(commandArguments);
    prettyPrint(commandArguments, arrayURL);
    let tempURL = updateListsOfURLs(knownList,arrayURL)
    tempURL.forEach((item)=>{
        newURLs.push(item);
    })
    for(let i = 0; i < numThreads; i ++){
        threads.add(new Worker("./worker.js"));
    }
    for(let worker of threads){
        let firstURL = newURLs.shift();
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
                let tempURL = updateListsOfURLs(knownList,workerFoundURL)
                tempURL.forEach((item)=>{
                    knownList.push(item);
                    newURLs.push(item);
                })
                let nextURL = newURLs.shift();
                if(nextURL !== undefined){
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