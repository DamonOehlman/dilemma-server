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
  var socket = zmq.socket('router');
  var actions = {};
  var counter = 0;

  // initialise the pending challengers array
  var pending = [];
  var active = [];

  function activate(challenger) {
    active.push(challenger);

    return challenger;
  }

  function checkPending(startIdx) {
    var test;
    var match;

    // ensure we have a value for start index
    startIdx = startIdx !== undefined ? startIdx : 0;

    // if we don't have enough challengers to perform a comparison
    // abort
    if (startIdx + 1 >= pending.length) {
      return;
    }

    // extract a challenger from the list
    test = pending.splice(startIdx, 1)[0];

    // iterate through the remaining items and check for a valid match
    pending.forEach(function(compare, idx) {
      var isMatch = (! match) &&
        (test.target === 'any' || test.target === compare.name) &&
        (compare.target === 'any' || compare.target === test.name);

      if (isMatch) {
        match = compare;
        pending.splice(idx, 1);
      }
    });

    // if we have a match, then pair off
    if (match) {
      return matchup(3, activate(test), activate(match));
    }

    // otherwise, reinsert the test item and check from the next item up
    pending.splice(startIdx, 0, test);
    checkPending(startIdx + 1);
  }

  actions.reg = function(source, name, target) {
    // var actionSocket = this;
    var challenger = new Challenger(this, source.toString(), {
      name: name.toString(),
      target: target.toString()
    });

    debug('new challlenger registered: ' + challenger.name);
    pending.push(challenger);

    // use the socket's event emitter to flag that a challenger
    // has been registered
    socket.emit('reg', challenger);

    // check for challenge requirements being satisfied
    checkPending();
  };

  actions.upload = function(source, result) {
    // find the specified challenger
    var challenger = active.filter(function(chal) {
      return chal.source === source.toString();
    })[0];

    if (challenger) {
      challenger.addResult(result.toString());
    }
  };

  function handleMessage(source, envelope, msgType) {
    var payload = [].slice.call(arguments, 3);
    var handler = actions[msgType];

    debug('message from: ' + source);
    debug('received message type: ' + msgType, arguments);

    if (typeof handler == 'function') {
      handler.apply(this, [source].concat(payload));
    }
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