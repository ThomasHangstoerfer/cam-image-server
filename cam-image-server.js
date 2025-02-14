// cam-image-server.js
//
// Usage:
//    nodejs cam-image-server.js
//
// Provides access to the latest image of the surveillance camera
// http://server:9615/latest.jpg
// http://server:9615/latest
//
// Or, with a given index, to previous images:
// http://server:9615/latest-1.jpg -> image before the latest
// http://server:9615/latest-2.jpg -> 2 images before the latest
//
// The image folder where new images from the cam are stored is watched
// for new files.
// If a file is added, a mqtt-message with the new filename is published under the topic 'cam/newImage'.
//
//
// Requirements:
// npm install

// mosquitto_sub -h localhost -v -t "cam/newImage"
// mosquitto_pub -h localhost -t "cam/newImage" -m "Hello world, Mosquitto"

var http = require('http');
var url = require('url');
var hound = require('hound');
var fs = require('fs');
var path = require('path');
var Jimp = require("jimp");

const mqtt = require('mqtt');

var baseDirectory = __dirname; // or whatever base directory you want

var cam_image_path = '/qnap/Download/today'
var cam_image_base_path = '/qnap/Download'
var http_server_port = 9615

var mqtt_broker = 'mqtt://apollo.fritz.box'
const mqtt_client = mqtt.connect(mqtt_broker)

mqtt_client.on('connect', () => {
    console.log('mqtt: Connected to mqtt-broker ' + mqtt_broker);
    //mqtt_client.subscribe('cam/newImage')
})

mqtt_client.on('error', (err) => {
    console.log('mqtt: Could not connect to ' + mqtt_broker + ': ' + err);
})

mqtt_client.on('message', (topic, message) => {
    if (topic === 'cam/newImage') {
        console.log('cam/newImage: ' + message.toString());
    }
})


// watch for new images and publish their filenames to mqtt-topic 'cam/newImage'
watcher = hound.watch(cam_image_path)
watcher.on('create', function (file, stats) {
    console.log(file + ' was created')
    if (mqtt_client.connected === true) {
        console.log('mqtt: publish ' + file + ' to topic ' + 'cam/newImage')
	var options={
		retain:true,
		qos:1
	};
        mqtt_client.publish('cam/newImage', file, options);
    }
})


function getLatest(index) {
    console.log("getLatest(" + index + ")");
    fs.realpath(cam_image_path, function (err, path) {
        if (err) {
            console.log(err);
            return "";
        }
        console.log('Path is : ' + path);
    });

    if (typeof index == 'undefined') {
        //console.log('undefined!');
        index = 0;
    }
    console.log('index: ' + index);
    //console.log('cam_image_path: ' + cam_image_path);

    var filelist = fs.readdirSync(cam_image_path);

    filelist.forEach(function (file, i) {
        //console.log('File: %d: %s', i, file);
        //console.log('indexOf = ' + file.indexOf('cam-20') );
        if (file.indexOf('cam-20') != 0) {
            filelist.splice(i, 1);
            //console.log('splice ' + i + ' - ' + file )
        }
    });
    filelist.sort(function (a, b) {
        return a == b ? 0 : +(a > b) || -1;
    });
    //filelist.forEach(file => {
    //    console.log('File: ' + file);
    //});
    var fileListIndex = filelist.length - index - 1;
    console.log('latest: ' + cam_image_path + "/" + filelist[fileListIndex]);
    return cam_image_path + "/" + filelist[fileListIndex];
}

function getFileTimestampString(filename) {
    var d = fs.statSync(filename).mtime;
    console.log('mtime: ' + d.getMonth());
    return d.getFullYear() + '-' +
        ("0" + (d.getMonth() + 1)).slice(-2) + '-' + ("0" + d.getDate()).slice(-2) + ' ' +
        ("0" + d.getHours()).slice(-2) + ':' + ("0" + d.getMinutes()).slice(-2);
}

function get_html_thumbnail_view(thumbnail_path) {

        var result = "";

	console.log('thumbnail_path: ', thumbnail_path);
            var filelist = fs.readdirSync(cam_image_base_path + thumbnail_path);

            filelist.forEach(function (file, i) {
                //console.log('File: %d: %s', i, file);
                //console.log('indexOf = ' + file.indexOf('cam-20') );
                if (file.indexOf('cam-20') != 0) {
                    filelist.splice(i, 1);
                    //console.log('splice ' + i + ' - ' + file )
                }
            });
            filelist.sort(function (a, b) {
                return a == b ? 0 : +(a > b) || -1;
            });
            result = '<html><head><title>Cam Images</title></head><body>' +
                     '<style>' +
                     '.wrapper { ' +
                     '    display: grid; ' +
                     '    grid-column-gap: 25px; grid-row-gap: 25px;' +
                     '}' +
                     '@media screen  { .wrapper { grid-template-columns: repeat(3, 1fr); } } ' +
                     '@media screen and (max-width: 800px) { .wrapper { grid-template-columns: repeat(2, 1fr); } } ' +
                     '@media screen and (max-width: 600px) { .wrapper { grid-template-columns: repeat(1, 1fr); } } ' +
                     '.wrapper > div a img { max-width: 100%; }' +
                     '</style>' +
                     '<div class="row">' +
                     '<div class="wrapper">';

            filelist.forEach(file => {
               result = result +'<div>' +
                     '   <a href="' + thumbnail_path + '/' + file + '">' +
                     '      <img src="' + thumbnail_path + '/' + file + '" />' +
                     '   </a>' +
                     '</div>';
            });
	    // get timestamp 'yesterday'
	    var d = new Date();
	    d.setDate(d.getDate() - 1);
            var ts = '' + d.getFullYear() + '-' + ("0" + (d.getMonth() + 1)).slice(-2) + '-' + ("0" + d.getDate()).slice(-2);
	    console.log('yesterday timestamp: ' + ts);
	    
            result = result + '</div>' +
                     '</div>' +
		     '<br><br>' +
		     '<a href="/' + ts + '">' + ts + '</a>' +
                     '</body></html>';

        return result;
}




http.createServer(function (request, response) {
    try {
        var requestUrl = url.parse(request.url);
        console.log("http-request: ", requestUrl);

        // need to use path.normalize so people can't access directories underneath baseDirectory
        var fsPath = baseDirectory + path.normalize(requestUrl.pathname);

        //console.log("fsPath = " + fsPath)
        //console.log("normalize = " + path.normalize(requestUrl.pathname))
        //console.log("pathname = " + requestUrl.pathname)

        var index = getIndex(requestUrl.pathname);
        //if (requestUrl.pathname == "/latest" || requestUrl.pathname == "/latest.jpg") {
        //if (requestUrl.pathname.startsWith( "/latest" ) ) { // nodejs on RaspPi does not have startsWith

	const myRe = /(\d\d\d\d)-(\d\d)-(\d\d)(.*)/g;
	const regex_match = myRe.exec(requestUrl.pathname);
	console.log('regex_match: ', regex_match);



        if (requestUrl.pathname.substring(0, "/latest".length) === "/latest") {
            fsPath = getLatest(index);

            var tsString = getFileTimestampString(fsPath);

            response.setHeader('Content-Type', 'image/jpeg');
            response.setHeader('cache-control', 'max-age=0'); // dont cache it on client-side
            console.log("LATEST " + tsString);

            //            Jimp.read(fsPath, function(err, image) {
            //                if (err) throw err;
            //                Jimp.loadFont(Jimp.FONT_SANS_32_WHITE).then(function(font) {
            //                    //image.print(font, image.bitmap.width * 0.6, image.bitmap.width * 0.7, tsString).write("/tmp/test.jpg");
            //                    image.print(font, image.bitmap.width * 0.6, image.bitmap.width * 0.7, tsString);
            //
            //                    image.getBuffer(Jimp.AUTO, function(err, buffer) {
            //                        //console.log('HIER', buffer);
            //                        response.writeHead(200);
            //                        response.write(buffer);
            //                        response.end();
            //                    });
            //
            //                });
            //            });
            //        } else {

            var fileStream = fs.createReadStream(fsPath);
            fileStream.pipe(response);
            fileStream.on('open', function () {
                response.writeHead(200);
            })
            fileStream.on('error', function (e) {
                response.writeHead(404); // assume the file doesn't exist
                response.end();
            })

        } else if (requestUrl.pathname === "/") {
            // return html with thumbnails of all images in 'today' folder
            console.log("/all");



            response.writeHead(200);


            html = get_html_thumbnail_view('/today');
            //console.log('html: ', html);

            response.writeHead(200);
            response.write(html);
            response.end();
        } else if (regex_match && (regex_match.length<=4 || regex_match[4].length < 2) ) {

	    console.log('REGEX match');
            //var req_path = "2023-06-08";
            var req_path = regex_match[1]+'-'+regex_match[2]+'-'+regex_match[3];
            html = get_html_thumbnail_view('/' + req_path);
            //console.log('html: ', html);
            response.writeHead(200);
            response.write(html);
            response.end();

        } else {
            console.log('request file');

            //console.log('fsPath = ' + fsPath );
            //console.log('cam_image_path = ' + cam_image_path);
            //console.log('requestUrl.pathname = ' + requestUrl.pathname );
            fsPath = cam_image_base_path + requestUrl.pathname;

            var fileStream = fs.createReadStream(fsPath);
            fileStream.pipe(response);
            fileStream.on('open', function () {
                response.writeHead(200);
            });
            fileStream.on('error', function (e) {
                response.writeHead(404); // assume the file doesn't exist
                response.end();
            });
        }
    } catch (e) {
        response.writeHead(500);
        response.write(e.stack);
        response.end(); // end the response so browsers don't hang
        console.log(e.stack);
    }
}).listen(http_server_port);

function getIndex(pathname) {
    var index = 0;
    try {
        const exp = /\/latest-(\d+).jpg/;
        var match = exp.exec(pathname);
        if (match) {
            console.log('match: ' + match[1]);
            index = parseInt(match[1]);
        }
    } catch (e) {
        console.log('getIndex(): ', e.stack);
    }
    console.log('getIndex(' + pathname + '): ' + index);
    return index;
}

//getLatest();
//getLatest(3);
console.log("listening on port " + http_server_port);

//getIndex("/latest");
//getIndex("/latest.jpg");
//getIndex("/latest-1.jpg");
//getIndex("/latest-11.jpg");
//getIndex("/latest-111.jpg");

