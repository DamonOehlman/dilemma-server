var EventEmitter = require('events').EventEmitter;
var List = require('collections/list');

module.exports = function() {
  var db = new EventEmitter();
  var pending = db.pending = new List();
  var active = db.active = new List();

  pending.addOwnPropertyChangeListener('length', function(value, key) {
    db.emit('change:pending');
  });

  return db;
};
