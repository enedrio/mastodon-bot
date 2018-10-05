const fs = require('fs');
const mergeImages = require('merge-images');
const PDF2Pic = require('pdf2pic').default
const gm = require('gm');

let converter = new PDF2Pic({
    density: 100,           // output pixels per inch
    savename: "image",   // output file name
    savedir: "./images",    // output file location
    format: "png",          // output file format
    size: 1200              // output size in pixels
})

var input = "/home/tobias/Downloads/test2.pdf"
var imagedir = "/home/tobias/mastodon-bot/images/"


converter.convertBulk(input, -1)
.then(resolve => {
    console.log("image converted successfully")
})

function merge(){
    console.log("Merging");
    
    if (fs.existsSync(imagedir + "/image_1.png")){
        console.log("I have 1 image to merge!")
    }
    
    if (((fs.existsSync(imagedir + "/image_1.png")) && (!fs.existsSync(imagedir + "/image_2.png"))) && (!fs.existsSync(imagedir + "/image_3.png"))) {
        console.log("I have 1 image to merge!")
        
        
    } else if (((fs.existsSync(imagedir + "/image_1.png")) && (fs.existsSync(imagedir + "/image_2.png"))) && (!fs.existsSync(imagedir + "/image_3.png"))) {
        console.log("I have 2 images to merge!")
        gm()
        .in('-page', '+0+0')
        .in(imagedir + 'image_1.png')
        .in('-page', '+0+1696')
        .in(imagedir + 'image_2.png')
        .mosaic()  // Merges the images as a matrix
        .write('output.png', function (err) {
            if (err) console.log(err);
        });
        
        
        
    } else if (((fs.existsSync(imagedir + "/image_1.png")) && (fs.existsSync(imagedir + "/image_2.png"))) && (fs.existsSync(imagedir + "/image_3.png"))) {
        console.log("I have 3 images to merge!")
        gm()
        .in('-page', '+0+0')
        .in(imagedir + 'image_1.png')
        .in('-page', '+0+1696')
        .in(imagedir + 'image_2.png')
        .in('-page', '+0+3392')
        .in(imagedir + 'image_3.png')
        .mosaic()  // Merges the images as a matrix
        .write(__dirname + 'output.png', function (err) {
            if (err) console.log(err);
        });
    }
}

setTimeout(merge, 5000);