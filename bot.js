const Mastodon = require('mastodon-api');
const path = require('path');
const env = require('dotenv');
const fs = require('fs');
const PDF2Pic = require('pdf2pic').default
const gm = require('gm');
const sleep = require('sleep');
var glob = require("glob")

// options is optional


var imagedir = "/home/tobias/mastodon-bot/images"
let converter = new PDF2Pic({
    density: 100,           // output pixels per inch
    savename: "image",      // output file name
    savedir: "./images",    // output file location
    format: "png",          // output file format
    size: 1200              // output size in pixels
})
env.config();

console.log("Mastodon bot starting. . . ")

const M = new Mastodon({
    client_secret: process.env.CLIENT_SECRET,
    client_key: process.env.CLIENT_KEY,
    access_token: process.env.AUTH_TOKEN,
    timeout_ms: 60*1000,  // optional HTTP request timeout to apply to all requests.
    api_url: 'https://botsin.space/api/v1/', // optional, defaults to https://mastodon.social/api/v1/
});


function tootImage(text) {
    var input = "/home/tobias/Downloads/test3.pdf"
    
    converter.convertBulk(input, -1)
    .then(resolve => {
        console.log("image converted successfully")
    });
    setTimeout(merge, 2500, text);
}

function merge(text){
    console.log("Merging");
    
    if (((fs.existsSync(imagedir + "/image_1.png")) && (!fs.existsSync(imagedir + "/image_2.png"))) && (!fs.existsSync(imagedir + "/image_3.png"))) {
        console.log("I have 1 image to merge!")
        M.post('media', { file: fs.createReadStream(`${imagedir}/image_1.png`) }).then(resp => {
            const id = resp.data.id;
            M.post('statuses', { status: text, media_ids: [id] })
        });
        
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
        M.post('media', { file: fs.createReadStream(`${__dirname}/output.png`) }).then(resp => {
            const id = resp.data.id;
            M.post('statuses', { status: text, media_ids: [id] })
        });
        
        
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
        
        M.post('media', { file: fs.createReadStream(`${__dirname}/output.png`) }).then(resp => {
            const id = resp.data.id;
            M.post('statuses', { status: text, media_ids: [id] })
        });
    }
    
    glob(imagedir + "/*", function(err, files) {
        for (var i of files) {
            fs.unlinkSync(files);
        }
    });  
    fs.unlinkSync(__dirname + "/output.png");      
    
    //fs.unlinkSync(files);
    
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


tootImage("Hi boys!");


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