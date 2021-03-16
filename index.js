const { isMainThread } = require("worker_threads");
const fetch = require("node-fetch");
const yargs = require("yargs");
const {parseHTML, prettyPrint, updateListsOfURLs} = require('./tools_utils.js');
const { StaticPool } = require("node-worker-threads-pool");
const path = require("path");

const workerScript = path.join(__dirname, "./worker.js");

const pool = new StaticPool({
    size: 6,
    task: workerScript,
});

/**
 * Function that setTimeout will call to end program if set
 *
 * @param none
 * @return none
 */
function closeEverything(){
    console.log("Timer expired!");
    process.exit(0);
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
    let setTimer = 300;
    let maxDepth = 5;
    const knownList = [];
    const newURLs = [];
    const options = yargs
        .usage("Usage: -u <url>")
        .option("u",{ alias: "url", describe: "Link/URL to start crawling from", type: "string", demandOption: true })
        .option("t",{ alias: "time", describe: "Sets a timer for when to stop (sec) (default: 300sec) (0 - run forever)", type: "number", demandOption: false})
        .option("d",{ alias: "depth", describe: "Sets the number of nested links the program will traverse before stopping (default: 5) (0 - run forever)", type: "number", demandOption: false})
        .argv;
    if(options.depth){
        if(options.depth < 0){
            console.error("Error: Depth cannot be a negative number");
        }
        maxDepth = options.depth;
    }
    else if(options.depth === 0){
        maxDepth = 0;
    }
    if(options.time){
        if(options.time < 0){
            console.error("Error: Number of seconds cannot be lower than 0");
            return;
        }
        setTimer = options.time;
    }
    else if(options.time === 0){
        setTimer = 0;
    }
    if(setTimer){
        setTimeout(closeEverything, (setTimer*1000));
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
    
    let arrayURL = parseHTML(stringifiedData, 0);
    knownList.push(commandArguments);
    prettyPrint(commandArguments, arrayURL);
    let tempURL = updateListsOfURLs(knownList,arrayURL)
    tempURL.forEach((item)=>{
        newURLs.push(item);
    })
    let nextURL = newURLs.shift();
    if(!(maxDepth) || nextURL.depth < maxDepth){
        while(nextURL.link){
            let message = await pool.exec({url:nextURL});
            prettyPrint(message.currentURL, message.foundURL);
            let tempURL = updateListsOfURLs(knownList,message.foundURL);
            tempURL.forEach((item)=>{
                knownList.push(item);
                newURLs.push(item);
            });
            nextURL = newURLs.shift();
            if(maxDepth !== 0 && nextURL.depth >= maxDepth){
                console.log("Max Depth Reached!");
                break;
            }
        }
    }
    console.log("Finished!");
    process.exit(0);
}

if (isMainThread) {
    main();
}