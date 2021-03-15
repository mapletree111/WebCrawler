const fs = require("fs");
const {parseHTML} = require('../tools_utils.js');
var expect  = require('chai').expect;

const testsCase = ["./test/htmlTest1.html", "./test/htmlTest2.html",
"./test/htmlTest3.html"];


describe("Testing Parser", function(){
    it("Should be an array of 0 length ", function(){
        fs.readFile(testsCase[0], "utf8", (err, data) =>{
            if(err){
                console.error(err);
                return;
            }
            let arrayofURL = parseHTML(data);
            expect(arrayofURL.length).to.be.equal(0);
        });
    });
    it("Should still return 0 length if <a> tag has no href", function(){
        fs.readFile(testsCase[1], "utf8", (err, data) =>{
            if(err){
                console.error(err);
                return;
            }
            let arrayofURL = parseHTML(data);
            expect(arrayofURL.length).to.be.equal(0);
        });
    })
    it("Should return 2 found links", function(){
        fs.readFile(testsCase[2], "utf8", (err, data) =>{
            if(err){
                console.error(err);
                return;
            }
            let arrayofURL = parseHTML(data);
            expect(arrayofURL.length).to.be.equal(2);
        });
    })
});