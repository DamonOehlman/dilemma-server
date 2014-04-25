/* jshint node: true */
'use strict';

var config = require('./config');
var debug = require('debug')('dilemma:webserver');
var fs = require('fs');
var http = require('http');
var mapleTree = require('mapleTree');
var port = parseInt(process.env.NODE_PORT || config.ports.http, 10);
var st = require('st');
var browserify = require('browserify');
var reJS = /\.js$/;

module.exports = function(socket, db) {
  var mount = st({
    cache: false,
    path: __dirname + '/static',
    index: 'index.html',
    passthrough: true
  });

  var router = new mapleTree.RouteTree();
  var server = http.createServer(handleRequest);

  function handleRequest(req, res) {
    mount(req, res, function() {
      var targetFile = __dirname + '/static' + req.url;
      var b;

      if (reJS.test(req.url) && fs.existsSync(targetFile)) {
        debug('browserifying file: ' + req.url)
        res.writeHead(200, {
          'content-type': 'text/javascript'
        });

        return browserify(__dirname + '/static' + req.url).bundle().pipe(res);
      }

      debug('no static file for: ' + req.url);

      res.writeHead(404);
      res.end('Not found');
    });
  }

  // start the server
  server.listen(port, function() {
    debug('server running at http://localhost:' + port);
  });

  return server;
};
