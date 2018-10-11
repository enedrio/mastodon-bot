const Mastodon = require('mastodon-api');
const path = require('path');
const env = require('dotenv').config();
const fs = require('fs');
const gm = require('gm');
const glob = require('glob');
const datereq = require('date-and-time');
const sleep = require('sleep');
const pdftoimage = require('pdftoimage');


var server = "http://www.sn.schule.de/~ms55l/";


var imagedir = __dirname + "/out";
var follows = [];
var followsString = "";
var instance = "https://botsin.space/api/v1/";

const M = new Mastodon({
    client_secret: process.env.CLIENT_SECRET,
    client_key: process.env.CLIENT_KEY,
    access_token: process.env.AUTH_TOKEN,
    api_url: instance, // optional, defaults to https://mastodon.social/api/v1/
});

console.log("Mastodon bot starting. . . ");

function whichDay() {
    let now = new Date();
    var date = datereq.format(now, 'ddd');
    var day = "";
    var displayDay = "";

    if (date === 'Mon') {
        displayDay = "Montag";
        day = "montag";
        console.log("Today is " + day);
    } else if (date === 'Tue') {
        displayDay = "Dienstag";
        day = "dienstag";
        console.log("Today is " + day);
    } else if (date === 'Wed') {
        displayDay = "Mittwoch";
        day = "mittwoch";
        console.log("Today is " + day);
    } else if (date === 'Thu') {
        displayDay = "Donnerstag";
        day = "donnerstag";
        console.log("Today is " + day);
    } else if (date === 'Fri') {
        displayDay = "Freitag";
        day = "freitag";
        console.log("Today is " + day);
    } else {
        console.log("Waiting one day. . .");
        sleep.sleep(60 * 60 * 24);
        whichDay();
    }
    return { 'day': day, 'displayDay': displayDay };
}

function downloadFileSync(url, file) {
    return require('child_process')
    .execFileSync('curl', ['--silent', '-L', '-o', file, url], {encoding: 'utf8'});
}

function download(pdf, png, url, text, prep, merg, tootImg, delFiles) {
    console.log("Downloading File: " + url + " to " + pdf);
    downloadFileSync(url, pdf);
    setTimeout(prep, 2500, pdf, png, text, merg, tootImg, delFiles);
}

function prepareImage(pdf, png, text, merg, tootImg, delFiles) {
    console.log("Converting " + pdf + " to /out/");
    pdftoimage(pdf, {
        format: 'png',  // png, jpeg, tiff or svg, defaults to png
        prefix: 'image',  // prefix for each image except svg, defaults to input filename
        outdir: 'out'   // path to output directory, defaults to current directory
    })
    .then(function(){
        console.log('Converted successfully!');
        setTimeout(merg, 2500, png, text, tootImg, delFiles);
    })
    .catch(function(err){
        console.log(err);
    });
}

function merge(png, text, tootImg, delFiles){
    
    console.log("Merging. . . ");
    
    if (((fs.existsSync(imagedir + "/image-1.png")) && (!fs.existsSync(imagedir + "/image-2.png"))) && (!fs.existsSync(imagedir + "/image-3.png"))) {
        console.log("No need to merge!");
        setTimeout(tootImage, 2500, png, text, delFiles);
        
    } else if (((fs.existsSync(imagedir + "/image-1.png")) && (fs.existsSync(imagedir + "/image-2.png"))) && (!fs.existsSync(imagedir + "/image-3.png"))) {
        console.log("I have 2 images to merge!")
        gm()
        .in('-page', '+0+0')
        .in(`${imagedir}/image-1.png`)
        .in('-page', '+1241+0')
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
        .in('-page', '+1241+0')
        .in(`${imagedir}/image-2.png`)
        .in('-page', '+2482+0')
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
            //fs.writeFileSync(`data${data.created_at}.json`, JSON.stringify(data, null, 2));
            console.log("Successful at " + data.created_at + " with ID " + data.id);
        }
    });
}

function tootImage(png, text, delFiles) {
    M.post('media', { file: fs.createReadStream(png) }).then(resp => {
        const id = resp.data.id;
        M.post('statuses', { status: text, media_ids: [id] })
    }).then(function() {
        console.log("Done tooting!")
        setTimeout(delFiles, 2500);
    });
}

function deleteFiles() {
    console.log("Deleting leftover files. . .");
    glob(imagedir + "/*.png", function(err, files) {
        for (var i of files) {
            fs.unlinkSync(i);
        }
    });  
    if (fs.existsSync(__dirname + "/output.png")){
        fs.unlinkSync(__dirname + "/output.png");      
    }
    if (fs.existsSync(__dirname + "/input.pdf")){
        fs.unlinkSync(__dirname + "/input.pdf");      
    }
    console.log("Deleted leftover files successfully!");
}

function search(nameKey, myArray){
    for (var i=0; i < myArray.length; i++) {
        if (myArray[i].name === nameKey) {
            return true;
        }
    }
}

function startBot(text, day) {
    download(__dirname + "/input.pdf",
    __dirname + "/output.png",
    server + day + ".pdf",
    text,
    prepareImage,
    merge,
    tootImage,
    deleteFiles
    );
}

function listen() {
    
    const listener = M.stream('streaming/user');
    
    console.log("Listening for mentions and follows on  Bot \"@TheDevMinerTV_Bot\"");
    var i = 0;
    listener.on('error', err => console.log(err));
    listener.on('message', msg => {
        
        // fs.writeFileSync(`data.json${Date.now()}`, JSON.stringify(msg, null, 2));
        
        if (msg.event === 'notification') {
            if (msg.data.type === 'follow') {
                const acct = msg.data.account.acct;
                if (!search(`@${acct}`,follows)) {
                    follows.push(`@${acct}`);
                    fs.writeFileSync(`follows.json`, JSON.stringify(follows, null, 2));
                }
                
                fs.writeFileSync(`data-${Date.now()}.json`, JSON.stringify(msg, null, 2));    
                console.log("User event!");
                
                while (i < (follows.length)) {
                    followsString = followsString + follows[i] + "\n";
                    i++;
                }
                console.log(followsString);
                toot(`@${acct} Herzlich willkommen bei Tobias' Vertretungplan-Bot!`);
                i = 0;
                followsString = "";
                
            } else if (msg.data.type === 'mention') {
                var res = msg.data.status.content.split("</span>");
                res = res[2];
                res = res.substring(1, (res.length - 4));
                
                if (res === "/vertretungsplan") {
                    var dayInfo = whichDay();
                    var day = dayInfo.day;
                    var displayDay = dayInfo.displayDay;

                    sleep.sleep(1);
                    
                    var defaultMSG = " Hier ist der Vertretungsplan für " + displayDay;
                    console.log(`@${msg.data.account.acct} asked for Vertretungsplan!`);
                    console.log(`Content of Toot: ${msg.data.account.acct}${defaultMSG}`);
                    startBot(`@${msg.data.account.acct}${defaultMSG}`, day);
                    
                } else {
                    console.log(`${msg.data.account.acct} mentioned with ${res}`);
                }
            }   
        }
    });
}

listen();
