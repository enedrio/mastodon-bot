const Mastodon = require('mastodon-api');
const path = require('path');
const env = require('dotenv');
const fs = require('fs');
const gm = require('gm');
const glob = require('glob');
const http = require('http');
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

function download(url) {
    return new Promise(function() {
        var input = "input.pdf"
        console.log("Type of input: " + typeof(input));
        console.log("Path: input.pdf");
        var file = fs.createWriteStream(input);
        var request = http.get(url, function(response) {
            response.pipe(file);
        });
    });
}

function prepareImage(input) {
    sleep.sleep(2);
    console.log("Converting");
    pdftoimage(input, {
        format: 'png',  // png, jpeg, tiff or svg, defaults to png
        prefix: 'image',  // prefix for each image except svg, defaults to input filename
        outdir: 'out'   // path to output directory, defaults to current directory
    })
    .then(function(){
        console.log('Conversion done');
    })
    .catch(function(err){
        console.log(err);
    });
}

function merge(){
    
    console.log("Starting merge");
    
    if (((fs.existsSync(imagedir + "/image_1.png")) && (!fs.existsSync(imagedir + "/image_2.png"))) && (!fs.existsSync(imagedir + "/image_3.png"))) {
        return new Promise(function(resolve, reject) {
            console.log("No need to merge!");
        });
    } else if (((fs.existsSync(imagedir + "/image_1.png")) && (fs.existsSync(imagedir + "/image_2.png"))) && (!fs.existsSync(imagedir + "/image_3.png"))) {
        return new Promise(function(imagedir) {
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
        });
    } else if (((fs.existsSync(imagedir + "/image_1.png")) && (fs.existsSync(imagedir + "/image_2.png"))) && (fs.existsSync(imagedir + "/image_3.png"))) {
        console.log("I have 3 images to merge!")
        return new Promise(function(imagedir) {
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
        });
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

function tootImage(text, image) {
    return new Promise(function(text, image) {
        M.post('media', { file: fs.createReadStream(image) }).then(resp => {
            const id = resp.data.id;
            M.post('statuses', { status: text, media_ids: [id] })
        });
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
    sleep.sleep(3);
    var config = [
        download(server + day + ".pdf"),
        prepareImage("/home/tobias/mastodon-bot/input.pdf"),
        merge(),
        tootImage("Hier ist der Vertretungsplan für " + displayDay, "/home/tobias/mastodon-bot/input.png")
    ];
    
    Promise.all(config)
    .catch(err => {  
        console.log(err);
    });
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