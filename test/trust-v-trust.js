var test = require('tape');
var server = require('../');
var socket;
var strategies = [];

test('start the server', function(t) {
  t.plan(2);
  server(function(err, s) {
    t.ifError(err, 'server started without error');
    t.ok(socket = s, 'got socket');
  });
});

test('register an always trust strategy', function(t) {
  t.plan(1);
  strategies[0] = require('./strategies/always-trust')();
  t.pass('registered');
});

test('register a second always trust strategy', function(t) {
  t.plan(1);
  strategies[1] = require('./strategies/always-trust')();
  t.pass('registered');
});

test('wait for server to complete the execution', function(t) {
  t.plan(1);
  setTimeout(function() {
    t.pass('done');
  }, 5000);
});

test('stop the server', function(t) {
  t.plan(1);
  socket.close();
  t.pass('closed ok');
});