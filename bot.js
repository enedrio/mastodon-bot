const Mastodon = require('mastodon-api');
const path = require('path');
const env = require('dotenv');
const fs = require('fs');
const gm = require('gm');
const glob = require('glob');
const datereq = require('date-and-time');
const sleep = require('sleep');
const pdftoimage = require('pdftoimage');


env.config();
var server = "http://www.sn.schule.de/~ms55l/";
var day = "";
var displayDay = "";
var imagedir = __dirname + "/out";
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
    
    if (date === 'Mon') {
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

function downloadFileSync(url, file) {
    return require('child_process')
    .execFileSync('curl', ['--silent', '-L', '-o', file, url], {encoding: 'utf8'});
}

function download(pdf, png, url, text, prep, merg, tootImg, delFiles) {
    console.log("Type of input: " + typeof(pdf));
    console.log("Path: " + pdf);
    downloadFileSync(url, pdf);
    setTimeout(prep, 2500, pdf, png, text, merg, tootImg, delFiles);
}

function prepareImage(pdf, png, text, merg, tootImg, delFiles) {
    console.log("Converting");
    pdftoimage(pdf, {
        format: 'png',  // png, jpeg, tiff or svg, defaults to png
        prefix: 'image',  // prefix for each image except svg, defaults to input filename
        outdir: 'out'   // path to output directory, defaults to current directory
    })
    .then(function(){
        console.log('Conversion done');
        setTimeout(merg, 2500, png, text, tootImg, delFiles);
    })
    .catch(function(err){
        console.log(err);
    });
}

function merge(png, text, tootImg, delFiles){
    
    console.log("Starting merge");
    
    if (((fs.existsSync(imagedir + "/image-1.png")) && (!fs.existsSync(imagedir + "/image-2.png"))) && (!fs.existsSync(imagedir + "/image-3.png"))) {
        console.log("No need to merge!");
        setTimeout(tootImage, 2500, png, text, delFiles);
        
    } else if (((fs.existsSync(imagedir + "/image-1.png")) && (fs.existsSync(imagedir + "/image-2.png"))) && (!fs.existsSync(imagedir + "/image-3.png"))) {
        console.log("I have 2 images to merge!")
        gm()
        .in('-page', '+0+0')
        .in(`${imagedir}/image-1.png`)
        .in('-page', '+0+1696')
        .in(`${imagedir}/image-2.png`)
        .mosaic()  // Merges the images as a matrix
        .write(png, function (err) {
            if (err) console.log(err);
        });
        setTimeout(tootImage, 2500, png, text, delFiles);
        
    } else if (((fs.existsSync(imagedir + "/image-1.png")) && (fs.existsSync(imagedir + "/image-2.png"))) && (fs.existsSync(imagedir + "/image-3.png"))) {
        console.log("I have 3 images to merge!")
        gm()
        .in('-page', '+0+0')
        .in(`${imagedir}/image-1.png`)
        .in('-page', '+0+1696')
        .in(`${imagedir}/image-2.png`)
        .in('-page', '+0+3392')
        .in(`${imagedir}/image-3.png`)
        .mosaic()  // Merges the images as a matrix
        .write(png, function (err) {
            if (err) console.log(err);
        });
        setTimeout(tootImage, 2500, png, text, delFiles);
        
    }
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

function tootImage(png, text, delFiles) {
    M.post('media', { file: fs.createReadStream(png) }).then(resp => {
        const id = resp.data.id;
        M.post('statuses', { status: text, media_ids: [id] })
    }).then(setTimeout(delFiles, 2500));
}

function deleteFiles() {
    glob(imagedir + "/*.png", function(err, files) {
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
    sleep.sleep(1);
    
    download("/home/tobias/mastodon-bot/input.pdf",
    "/home/tobias/mastodon-bot/output.png",
    server + day + ".pdf",
    "Hier ist der Vertretungsplan für " + displayDay,
    prepareImage,
    merge,
    tootImage,
    deleteFiles
    );
}

startBot();





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