
# cam-image-server.js

Usage:
   nodejs cam-image-server.js

Provides access to the latest image of the surveillance camera


http://server:9615/latest.jpg
http://server:9615/latest

Or, with a given index, to previous images:

http://server:9615/latest-1.jpg -> image before the latest
http://server:9615/latest-2.jpg -> 2 images before the latest
