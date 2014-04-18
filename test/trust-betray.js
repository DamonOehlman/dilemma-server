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
  t.plan(3);

  server.once('strategy', function(item) {
    t.ok(item, 'got item');
    t.equal(item.key, 'always-trust');
  });

  strategies[0] = require('./strategies/always-trust')();
  t.pass('registered');
});

test('register an always betray strategy', function(t) {
  t.plan(3);

  server.once('strategy', function(item) {
    t.ok(item, 'got item');
    t.equal(item.key, 'always-betray');
  });

  strategies[0] = require('./strategies/always-betray')();
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
  server.socket.close();
  t.pass('closed ok');
});
