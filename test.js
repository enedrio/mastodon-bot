const date = require('date-and-time');
const sleep = require('sleep');
/*
let now;
while (true) {
    let now = new Date();
    var day = date.format(now, 'ddd');
    sleep.sleep(10);

    if(day === 'Mon') {

    }

}
*/

var http = require('http');
var fs = require('fs');

var server = "http://www.sn.schule.de/~ms55l/"
var day = "montag"
var output = "montag.pdf"


var file = fs.createWriteStream(output);
var request = http.get(`${server}${day}`, function(response) {
  response.pipe(file);
});