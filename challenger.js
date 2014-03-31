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
}

module.exports = Challenger;
util.inherits(Challenger, EventEmitter);

var prot = Challenger.prototype;

prot.run = function() {
  this.send('run');
};

prot.send = function() {
  this.socket.send([this.source, ''].concat([].slice.call(arguments)));
};