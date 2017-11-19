
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


var http = require('http')
var url = require('url')
var fs = require('fs')
var path = require('path')
var baseDirectory = __dirname // or whatever base directory you want

var cam_image_path = '/qnap/Download/today'
var port = 9615


function getLatest(index) {
    fs.realpath(cam_image_path, function(err, path) {
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

    var filelist = fs.readdirSync(cam_image_path);

    filelist.forEach(function(file, i) {
        //console.log('File: %d: %s', i, file);
        //console.log('indexOf = ' + file.indexOf('cam-201') );
        if (file.indexOf('cam-201') != 0) {
            filelist.splice(i, 1);
            //console.log('splice ' + i + ' - ' + file )
        }
    });
    filelist.sort(function(a, b) {
        return a == b ? 0 : +(a > b) || -1;
    });
    //filelist.forEach(file => {
    //    console.log('File: ' + file);
    //});
    var fileListIndex = filelist.length - index - 1;
    console.log('latest: ' + cam_image_path + "/" + filelist[fileListIndex]);
    return cam_image_path + "/" + filelist[fileListIndex];
}


http.createServer(function(request, response) {
    try {
        var requestUrl = url.parse(request.url);

        // need to use path.normalize so people can't access directories underneath baseDirectory
        var fsPath = baseDirectory + path.normalize(requestUrl.pathname);

        //console.log("fsPath = " + fsPath)
        //console.log("normalize = " + path.normalize(requestUrl.pathname))
        //console.log("pathname = " + requestUrl.pathname)

        var index = getIndex(requestUrl.pathname);
        //if (requestUrl.pathname == "/latest" || requestUrl.pathname == "/latest.jpg") {
        if (requestUrl.pathname.startsWith( "/latest" ) ) {
            fsPath = getLatest(index);
            response.setHeader('Content-Type', 'image/jpeg');
            console.log("LATEST");
        }

        var fileStream = fs.createReadStream(fsPath);
        fileStream.pipe(response);
        fileStream.on('open', function() {
            response.writeHead(200);
        })
        fileStream.on('error', function(e) {
            response.writeHead(404); // assume the file doesn't exist
            response.end();
        })
    } catch (e) {
        response.writeHead(500);
        response.end(); // end the response so browsers don't hang
        console.log(e.stack);
    }
}).listen(port);

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
console.log("listening on port " + port);

//getIndex("/latest");
//getIndex("/latest.jpg");
//getIndex("/latest-1.jpg");
//getIndex("/latest-11.jpg");
//getIndex("/latest-111.jpg");