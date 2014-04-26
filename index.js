var config = require('./config');
var debug = require('debug')('dilemma-server');
var EventEmitter = require('events').EventEmitter;
var zmq = require('zmq');
var defaults = require('cog/defaults');
var matchup = require('./matchup');
var Challenger = require('./challenger.js');
var pull = require('pull-stream');
var processor = require('./processor');

/**
  # dilemma-server

  This is a server for automating the execution of
  [prisoners dilemma](http://en.wikipedia.org/wiki/Prisoner's_dilemma)
  strategies in an iterated, competitive environment.  This is being done for
  an upcoming [NICTA](http://nicta.com.au/) engineering retreat - yeah I know,
  NICTA is a cool place to work :)

  <<< docs/interfacing.md

**/
module.exports = function(opts, callback) {
  var server = new EventEmitter();
  var db = server.db = require('./db')(server, opts);
  var socket = server.socket = zmq.socket('router');
  var actions = require('./actions')(socket, db);

  // create the web interface
  var web = server.web = require('./webserver')(socket, db);

  // initialise server comms
  var comms = server.comms = require('./comms')(socket);

  function handleConnect() {
    console.log('connect', arguments);
  }

  function handleMessage(source, envelope, msgType) {
    var payload = [].slice.call(arguments, 3).map(toString);
    var handler = actions[msgType];

    debug("received message: " + msgType.toString(), payload);
    if (typeof handler == 'function') {
      handler.apply(this, [source].concat(payload));
    }
  }

  function toString(target) {
    return typeof target.toString == 'function' ? target.toString() : target;
  }

  if (typeof opts == 'function') {
    callback = opts;
    opts = {};
  }

  // initialise default opts
  opts = defaults({}, opts, {
    host: '0.0.0.0',
    port: config.ports.zmq
  });

  debug('attempting to bind server to tcp://' + opts.host + ':' + opts.port);

  socket.identity = 'dilemma-server'; // TODO: include ip
  socket.bind('tcp://' + opts.host + ':' + opts.port, function(err) {
    if (err) {
      return callback(err);
    }

    debug('started');
    socket.on('connect', handleConnect);
    socket.on('message', handleMessage);
    callback(null, socket);
  });

  // process the queue
  pull(
    server.queue.read(),
    processor(server, db)
  );

  return server;
};
