var EventEmitter = require('events').EventEmitter;
var util = require('util');

function Challenger(data) {
  if (! (this instanceof Challenger)) {
    return new Challenger(data);
  }

  this.name = (data || {}).name || '';
  this.target = (data || {}).target || 'any';
}

module.exports = Challenger;
util.inherits(Challenger, EventEmitter);

var prot = Challenger.prototype;