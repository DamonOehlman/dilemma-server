var debug = require('debug')('dilemma:action-reg');
var Challenger = require('../challenger.js');

module.exports = function(socket, db) {
  return function(source, name, target) {
    var challenger = new Challenger(this, source, {
      name: name,
      target: target
    });

    debug('new challlenger registered: ' + challenger.name);
    db.pending.push(challenger);

    // use the socket's event emitter to flag that a challenger
    // has been registered
    socket.emit('reg', challenger);
  };
};
