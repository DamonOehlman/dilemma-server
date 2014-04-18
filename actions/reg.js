var debug = require('debug')('dilemma:action-reg');
var Challenger = require('../challenger.js');
var ts = require('monotonic-timestamp');

module.exports = function(socket, db) {
  return function(source, name) {
    debug('registering strategy: ' + name);

    // write a log entry showing an update
    db.log('reg', 'registered strategy ' + name + ' for source: ' + source);

    // save the strategy
    db.strategyStore.put(name, source);
  };
};
