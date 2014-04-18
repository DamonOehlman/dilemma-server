var debug = require('debug')('dilemma-server');
var zmq = require('zmq');
var defaults = require('cog/defaults');
var matchup = require('./matchup');
var Challenger = require('./challenger.js');

/**
  # dilemma-server

  This is a server for automating the execution of
  [prisoners dilemma](http://en.wikipedia.org/wiki/Prisoner's_dilemma)
  strategies in an iterated, competitive environment.  This is being done for
  an upcoming [NICTA](http://nicta.com.au/) engineering retreat - yeah I know,
  NICTA is a cool place to work :)

  ## Interfacing with the Server

  Interfacing with the server is primarily done through interfacing with
  a [ØMQ](http://zeromq.org/) TCP socket on port `1441` (by default) of the
  machine this server is run on.  ØMQ was chosen as the communication layer
  as it provides bindings for a large number of languages and people should
  be free to choose whatever language they want for implementing their
  strategies.

  Alternatively the node [dilemma](https://github.com/DamonOehlman/dilemma)
  runner can be used to interface with your program simply using stdio.  If
  you would prefer to go down this route (it is very simple, but does mean
  you will need to install node to execute the runner) then check out
  the `dilemma` README.

  ## ØMQ Communication Layer

  For running the challenge a simple request, respond pattern
  has been used to implement client -> server communications.  When the
  server is started it will bind to port `1441` (by default) on the
  local machine.

**/
module.exports = function(opts, callback) {
  var db = require('./db')(opts);
  var socket = zmq.socket('router');
  var actions = require('./actions')(socket, db);

  function handleMessage(source, envelope, msgType) {
    var payload = [].slice.call(arguments, 3);
    var handler = actions[msgType];

    debug('message from: ' + source);
    debug('received message type: ' + msgType, arguments);

    if (typeof handler == 'function') {
      handler.apply(this, [source].concat(payload).map(toString));
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
    port: 1441
  });

  debug('attempting to bind server to tcp://' + opts.host + ':' + opts.port);

  socket.identity = 'dilemma-server'; // TODO: include ip
  socket.bind('tcp://' + opts.host + ':' + opts.port, function(err) {
    if (err) {
      return callback(err);
    }

    debug('started');
    socket.on('message', handleMessage);
    callback(null, socket);
  });

  return socket;
};
