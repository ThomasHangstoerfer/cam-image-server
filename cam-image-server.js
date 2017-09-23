var http = require('http')
var url = require('url')
var fs = require('fs')
var path = require('path')
var baseDirectory = __dirname // or whatever base directory you want

var cam_image_path = '/qnap/Download'
var port = 9615


function getLatest() {
    fs.realpath(cam_image_path, function(err, path) {
        if (err) {
            console.log(err);
            return "";
        }
        console.log('Path is : ' + path);
    });

    var filelist = fs.readdirSync(cam_image_path)

    filelist.forEach(function(file, i) {
        //console.log('File: %d: %s', i, file);
        if (file.indexOf('cam-201') != 0) {
            filelist.splice(i, 1)
            //console.log('splice ' + i + ' - ' + file )
        }
    });
    filelist.sort(function(a, b) {
        return a == b ? 0 : +(a > b) || -1;
    });
    //filelist.forEach(file => {
    //    console.log('File: ' + file);
    //});
    console.log('latest: ' + cam_image_path + "/" + filelist[filelist.length - 1])
    return cam_image_path + "/" + filelist[filelist.length - 1];
}


http.createServer(function(request, response) {
    try {
        var requestUrl = url.parse(request.url)

        // need to use path.normalize so people can't access directories underneath baseDirectory
        var fsPath = baseDirectory + path.normalize(requestUrl.pathname)

        //console.log("fsPath = " + fsPath)
        //console.log("normalize = " + path.normalize(requestUrl.pathname))
        //console.log("pathname = " + requestUrl.pathname)

        if (requestUrl.pathname == "/latest" || requestUrl.pathname == "/latest.jpg" ) {
            fsPath = getLatest()
            response.setHeader('Content-Type', 'image/jpeg');
            console.log("LATEST")
        }

        var fileStream = fs.createReadStream(fsPath)
        fileStream.pipe(response)
        fileStream.on('open', function() {
            response.writeHead(200)
        })
        fileStream.on('error', function(e) {
            response.writeHead(404) // assume the file doesn't exist
            response.end()
        })
    } catch (e) {
        response.writeHead(500)
        response.end() // end the response so browsers don't hang
        console.log(e.stack)
    }
}).listen(port)

getLatest()
console.log("listening on port " + port)