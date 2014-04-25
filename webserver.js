/* jshint node: true */
'use strict';

var config = require('./config');
var debug = require('debug')('dilemma:webserver');
var http = require('http');
var mapleTree = require('mapleTree');
var port = parseInt(process.env.NODE_PORT || config.ports.http, 10);
var st = require('st');

module.exports = function(socket, db) {
  var mount = st({
    path: __dirname + '/static',
    index: 'index.html',
    passthrough: true
  });

  var router = new mapleTree.RouteTree();
  var server = http.createServer(handleRequest);

  function handleRequest(req, res) {
    mount(req, res, function() {
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
