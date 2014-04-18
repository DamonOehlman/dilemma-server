var debug = require('debug')('dilemma-challenger');
var EventEmitter = require('events').EventEmitter;
var util = require('util');

function Challenger(socket, source, data) {
  if (! (this instanceof Challenger)) {
    return new Challenger(data);
  }

  // save the socket
  this.socket = socket;

  // save the socket source
  this.source = source;

  // initialise data
  this.name = (data || {}).name || '';
  this.target = (data || {}).target || 'any';

  // initialise the results array
  this.results = [];
}

module.exports = Challenger;
util.inherits(Challenger, EventEmitter);

var prot = Challenger.prototype;

prot.addResult = function(result) {
  debug('received result: ' + result);
  this.results.push(result);

  // emit the result on next tick
  process.nextTick(this.emit.bind(this, 'result', result));
};

prot.run = function() {
  debug('sending iterate message to challenger: ' + this.source);
  this.send('iterate');
};

prot.send = function() {
  this.socket.send([this.source, ''].concat([].slice.call(arguments)));
};
