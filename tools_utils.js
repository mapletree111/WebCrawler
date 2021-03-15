const fetch = require("node-fetch");
const cheerio = require("cheerio");

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

module.exports = {parseHTML, prettyPrint};