const cheerio = require("cheerio");
const fs = require("fs");
const updateURLFilePath = "./.tmpFile";

/**
 * Prints to the console the current URL the web-crawler is on
 * and any URLs it found on that page.
 *
 * @param {string} initialURL URL web-crawler visited
 * @param {array} listOfURLs List of URLs found underneath the visited URL
 * @return none
 */
function prettyPrint(initialURL, listOfURLs){
    console.log(initialURL);
    if(listOfURLs.length !== 0){
        listOfURLs.forEach((item)=>{
            console.log(" ",item);
        });
    }
    return;
}
/**
 * Utilizing cheerio library to parse a string version of the DOM
 * and obtain any <a href="http*"> elements. Construct a list with
 * appropriate depth level and return it.
 *
 * @param {string} data Stringified version of the DOM for parsing
 * @return {array} arrayURL List of <a href="http*"> saw in the DOM
 */
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

/**
 * Checks with list of known URLs for uniques, and
 * returns that list of unique URLs
 *
 * @param {array} knownList Array of already seen URLs.
 * @param {array} arrayOfURLs The Array of URL to check for duplicates.
 * @return {array} copyOfNewUrls List of unseen URLs
 */
function updateListsOfURLs(knownList, arrayOfURLs){
    let lengthOfURLArray = (arrayOfURLs.length);
    let copyOfNewUrls = [];
    if(lengthOfURLArray > 0){
        // Loop through all the newly acquire URLs
        arrayOfURLs.forEach((item)=>{
            if(knownList.includes(item)){
                return;
            }
            else{
                // Take note of only unique ones
                knownList.push(item);
                copyOfNewUrls.push(item);
            }
        });
    }
    return copyOfNewUrls;
}
/**
 * Takes new list of URLs and appends it to temporary file to
 * eventually make requests to.
 *
 * @param {array} arrayOfURLs The Array of URL append.
 * @return none
 */
function updateFile(arrayOfURLs){
    fs.appendFileSync(updateURLFilePath, arrayOfURLs.join('\n'));
}
/**
 * Pops the first line out of the file containing URLs
 *
 * @param none
 * @return Promise when resolve will contain the first line of the file
 */
function getDataFromFile(){
    return new Promise((resolve, reject)=>{
        let firstLine = null;
        fs.readFile(updateURLFilePath, 'utf8', function(err, data){
            if(err){
                console.err("Reading file error:",err);
            }
            else{
                firstLine = data.split('\n')[0];
                var linesExceptFirst = data.split('\n').slice(1).join('\n');
                fs.writeFileSync(updateURLFilePath, linesExceptFirst);
                resolve(firstLine);
            }
        })
    })
}

module.exports = {parseHTML, prettyPrint, updateListsOfURLs, updateURLFilePath, updateFile, getDataFromFile};