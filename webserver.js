/* jshint node: true */
'use strict';

var config = require('./config');
var debug = require('debug')('dilemma:webserver');
var fs = require('fs');
var http = require('http');
var mapleTree = require('mapleTree');
var pl = require('pull-level');
var pull = require('pull-stream');
var sse = require('pull-sse');
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

  function browserifyJS(req, res) {
    var targetFile = __dirname + '/static/_js/' + this.params.file + '.js';
    var b;

    debug('attempting to browserify file: ' + targetFile);
    if (! fs.existsSync(targetFile)) {
      return notfound(req, res);
    }

    res.writeHead(200, {
      'content-type': 'application/javascript;charset=utf-8'
    });

    return browserify(targetFile).bundle().pipe(res);
  }

  function handleRequest(req, res) {
    mount(req, res, function() {
      var match = router.match(req.url);

      debug('url requested: ' + req.url, match && typeof match.fn);
      if (match && typeof match.fn == 'function') {
        return match.fn(req, res);
      }

      return notfound(req, res);
    });
  }

  function notfound(req, res) {
    debug('no static file for: ' + req.url);

    res.writeHead(404);
    res.end('Not found');
  }

  function serveData(req, res) {
    var endpoint = db[this.params.endpoint];

    // if we don't have an endpoint, then return notfound
    debug('looking for data endpoint: ' + this.params.endpoint + ', found: ' + (!!endpoint));
    if (! endpoint) {
      return notfound(req, res);
    }

    return pull(
      pl.read(endpoint, { tail: true }),
      sse(res)
    );
  }

  router.define('/js/:file.js', browserifyJS);
  router.define('/data/:endpoint', serveData);

  // start the server
  server.listen(port, function() {
    debug('server running at http://localhost:' + port);
  });

  return server;
};
