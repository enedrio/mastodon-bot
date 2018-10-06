const Mastodon = require('mastodon-api');
const path = require('path');
const env = require('dotenv');
const fs = require('fs');
const PDF2Pic = require('pdf2pic').default;
const gm = require('gm');
const glob = require('glob');
const http = require('http');
const datereq = require('date-and-time');
const sleep = require('sleep');

let converter = new PDF2Pic({
    density: 100,           // output pixels per inch
    savename: "image",      // output file name
    savedir: "./images",    // output file location
    format: "png",          // output file format
    size: 1200              // output size in pixels
});
env.config();
var server = "http://www.sn.schule.de/~ms55l/";
var day = "montag";
var displayDay = "";
var imagedir = __dirname + "/images";
var output = "montag.pdf";
const M = new Mastodon({
    client_secret: process.env.CLIENT_SECRET,
    client_key: process.env.CLIENT_KEY,
    access_token: process.env.AUTH_TOKEN,
    timeout_ms: 60*1000,  // optional HTTP request timeout to apply to all requests.
    api_url: 'https://botsin.space/api/v1/', // optional, defaults to https://mastodon.social/api/v1/
});

console.log("Mastodon bot starting. . . ");

function whichDay() {
    let now = new Date();
    var date = datereq.format(now, 'ddd');
    
    if (date === 'Sat') {
        displayDay = "Montag";
        day = "montag";
        console.log(day);
    } else if (date === 'Tue') {
        displayDay = "Dienstag";
        day = "dienstag";
        console.log(day);
    } else if (date === 'Wed') {
        displayDay = "Mittwoch";
        day = "mittwoch";
        console.log(day);
    } else if (date === 'Thu') {
        displayDay = "Donnerstag";
        day = "donnerstag";
        console.log(day);
    } else if (date === 'Fri') {
        displayDay = "Freitag";
        day = "freitag";
        console.log(day);
    } else {
        console.log("Waiting one day. . .");
        sleep.sleep(60 * 60 * 24);
        whichDay();
    }
}

function download(url, place) {
    var file = fs.createWriteStream(place);
    var request = http.get(url, function(response) {
        response.pipe(file);
    });
}

function prepareImage(input) {
    converter.convertBulk(input, -1)
    .then(resolve => {
        console.log("image converted successfully")
    });
}

function merge(text){
    
    console.log("Starting merge");
    
    if (((fs.existsSync(imagedir + "/image_1.png")) && (!fs.existsSync(imagedir + "/image_2.png"))) && (!fs.existsSync(imagedir + "/image_3.png"))) {
        console.log("No need to merge!")
        tootImage(text);
    } else if (((fs.existsSync(imagedir + "/image_1.png")) && (fs.existsSync(imagedir + "/image_2.png"))) && (!fs.existsSync(imagedir + "/image_3.png"))) {
        console.log("I have 2 images to merge!")
        gm()
        .in('-page', '+0+0')
        .in(`${imagedir}/image_1.png`)
        .in('-page', '+0+1696')
        .in(`${imagedir}/image_2.png`)
        .mosaic()  // Merges the images as a matrix
        .write('output.png', function (err) {
            if (err) console.log(err);
        });
        tootImage(text);
    } else if (((fs.existsSync(imagedir + "/image_1.png")) && (fs.existsSync(imagedir + "/image_2.png"))) && (fs.existsSync(imagedir + "/image_3.png"))) {
        console.log("I have 3 images to merge!")
        gm()
        .in('-page', '+0+0')
        .in(`${imagedir}/image_1.png`)
        .in('-page', '+0+1696')
        .in(`${imagedir}/image_2.png`)
        .in('-page', '+0+3392')
        .in(`${imagedir}/image_3.png`)
        .mosaic()  // Merges the images as a matrix
        .write(__dirname + 'output.png', function (err) {
            if (err) console.log(err);
        });
        tootImage(text);
    }
    setTimeout(deleteFiles, 1000);
}

function toot(text) {
    const params = {
        status: text
    }
    
    M.post('statuses', params, (error, data) => {
        if (error){
            console.error(error);
        } else {
            //fs.writeFileSync('data.json', JSON.stringify(data, null, 2));
            console.log("Successful at " + data.created_at + " with ID " + data.id);
        }
    });
}

function tootImage(text) {
    M.post('media', { file: fs.createReadStream(__dirname + "/output.png") }).then(resp => {
        const id = resp.data.id;
        M.post('statuses', { status: text, media_ids: [id] })
    });
}

function deleteFiles() {
    glob(imagedir + "/*", function(err, files) {
        for (var i of files) {
            console.log(i);
            fs.unlinkSync(i);
        }
    });  
    if (fs.existsSync(__dirname + "/output.png")){
        fs.unlinkSync(__dirname + "/output.png");      
    }
    if (fs.existsSync(__dirname + "/input.pdf")){
        fs.unlinkSync(__dirname + "/input.pdf");      
    }
}

function startBot() {
    whichDay();
    console.log("Downloading: " + server + day + ".pdf")
    download(server + day + ".pdf", "input.pdf");
    console.log("Converting PDF " + __dirname + "/input.pdf to PNG");
    prepareImage(`${__dirname}/input.pdf`);
    
    setTimeout(merge, 2500, "Hier ist der Vertretungsplan für" + displayDay);
    tootImage("Hi boys!");
}

//startBot();

setTimeout(deleteFiles, 1000);
setTimeout(download, 1000, server + day + ".pdf", "input.pdf");
setTimeout(prepareImage, 2000, `${__dirname}/input.pdf`);




/*
const listener = M.stream('streaming/user')

listener.on('message', msg => {
    if (msg.event === 'notification') {
        if (msg.data.type === 'follow') {
            const acct = msg.data.account.acct;
            const id = msg.data.account.id;
            toot(`@${msg.data.account.acct} Hello and welcome aboard!`);
            
            fs.writeFileSync(`data.json${Date.now()}`, JSON.stringify(msg, null, 2));    
            console.log("User event!");
        }
    }
    
});

listener.on('error', err => console.log(err));
*/