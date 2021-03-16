const fetch = require("node-fetch");
const cheerio = require("cheerio");

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
 * to obtain any <a href="http*"> elements.
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

module.exports = {parseHTML, prettyPrint, updateListsOfURLs};