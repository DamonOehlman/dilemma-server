var test = require('tape');
var createServer = require('../');
var server;
var strategies = [];

test('start the server', function(t) {
  t.plan(2);
  server = createServer(function(err) {
    t.ifError(err, 'server started without error');
    t.ok(server, 'got socket');
  });
});

test('register an always trust strategy', function(t) {
  t.plan(2);

  server.once('reg', function(challenger) {
    t.pass('received registration notification');
  });

  strategies[0] = require('./strategies/always-trust')();
  t.pass('registered');
});

test('register a second always trust strategy', function(t) {
  t.plan(2);

  server.once('reg', function(challenger) {
    t.pass('received registration notification');
  });

  strategies[0] = require('./strategies/always-trust')();
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
  server.close();
  t.pass('closed ok');
});