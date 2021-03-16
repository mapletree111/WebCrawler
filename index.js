const { isMainThread, Worker } = require("worker_threads");
const fetch = require("node-fetch");
const yargs = require("yargs");
const {parseHTML, prettyPrint} = require('./tools_utils.js');
const path = require("path");
const mysql = require('mysql');
const config = require('./config.json');

const numThreads = 2;

const workerScript = path.join(__dirname, "./worker.js");
const { host, port, user, password } = config.database;
const threads = new Set();

const con = mysql.createConnection({ host, port, user, password });

function initializeDatabase(){
    return new Promise((resolve, reject)=>{
        con.connect(function(err) {
            if(err){
                console.log(`Error, database was not setup correctly: host:${host}, port:${port}, user:${user}`)
                reject(err);
            }
            else{
                con.query("CREATE DATABASE IF NOT EXISTS webcrawler", function (err) {
                    if (err){ 
                        reject(err);

                    }
                    con.query("use webcrawler", function (err) {
                        if (err) {
                            reject(err);

                        }
                        let createURLTable = `CREATE TABLE IF NOT EXISTS Links(
                            id int primary key auto_increment,
                            url varchar(255)not null
                            )`;
                        con.query(createURLTable, function(err){
                            if (err) {
                                reject(err);

                            }
                            let clearCommand = "TRUNCATE TABLE Links";  
                            con.query(clearCommand, function (err) {  
                                if (err) {
                                    reject(err);

                                }
                                resolve(true);
                            });
                        });
                    });
                });
            }
        })
    });
}

function insertIntoTable(data){
    if(data.length > 255){
        console.log("Unable to add URL, url too large");
        return;
    }
    return new Promise((resolve, reject)=>{
        let insertCmd = "INSERT INTO Links (url) VALUES ('"+data+"')";  
        con.query(insertCmd, function (err) {  
            if (err){ 
                console.log("Cannot add:",data , "\nError code:", err.code);
            }
            resolve(true);
        });
    });
    
}

function removeFirstElement(){
    return new Promise((resolve, reject)=>{
        con.query("DELETE FROM Links LIMIT 1", function (err) {  
            if (err) {
                throw err;
            }
            else{
                resolve(true);
            }
        });
    });
}

function getFirstElement(){
    return new Promise((resolve, reject)=>{
        let sqlGET = "SELECT * from Links LIMIT 1";
        con.query(sqlGET, function (err, result) {  
            if (err) {
                throw err;
            }
            else{
                resolve(result[0]);
            }
        });
    });
    
}

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
    const options = yargs
        .usage("Usage: -u <url>")
        .option("u",{ alias: "url", describe: "Link/URL to start crawling from", type: "string", demandOption: true })
        .option("t",{ alias: "time", describe: "Sets a timer for when to stop (sec) (default: 300sec) (0 - run forever)", type: "number", demandOption: false})
        .argv;
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
    // Initialize database/table
    await initializeDatabase();

    // Start of first iteration
    try{
        data = await fetch(commandArguments)
        stringifiedData =  await data.text();

    }
    catch(err){
        console.error(`Error: Invalid URL provided: ${commandArguments}\n${err}`);
        return;
    }
    
    let arrayURL = parseHTML(stringifiedData, 0);

    prettyPrint(commandArguments, arrayURL);
    for(let i = 0; i < arrayURL.length; i++){
        await insertIntoTable(arrayURL[i]);
    }
    

    for(let i = 0; i < numThreads; i ++){
        threads.add(new Worker(workerScript));
    }
    // Loop for workers
    // while(nextURL.url){
        // let message = await pool.exec({url:nextURL.url});
        // prettyPrint(message.currentURL, message.foundURL);
        
    // }
    let counter = numThreads;
    let nextURL = null;
    for(let worker of threads){
        if(counter === 0){
            break;
        }
        nextURL = await getFirstElement();
        await removeFirstElement();
        if(nextURL !== undefined){
            worker.postMessage({exit:true});
        }
        worker.on("error", (err) => {console.error("Error: Something we wrong with one of the threads:", err)});
        worker.on('exit', ()=>{
            threads.delete(worker);
            threads.add(new Worker(workerScript));
        })
        worker.on('message', async (message) => {
            
            prettyPrint(message.currentURL, message.foundURL);
            for(let i = 0; i < message.foundURL.length; i++){
                await insertIntoTable(message.foundURL[i]);
            }
            
            nextURL = await getFirstElement();
            await removeFirstElement();

            if(nextURL !== undefined){
                worker.postMessage({url:nextURL});
            }
            else{
                counter--;
            }
        });
    }

    console.log("Finished!");
    process.exit(0);
}

if (isMainThread) {
    main();
}