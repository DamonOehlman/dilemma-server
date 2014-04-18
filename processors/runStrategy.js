var async = require('async');
var debug = require('debug')('dilemma:checkStrategy');

module.exports = function(server, db) {
  return function(strategy, callback) {
    // get the strategies not including the current strategy
    var otherStrategies = db.strategies.filter(function(name) {
      return name !== strategy;
    });

    debug('pairing new strategy ' + strategy + ' with existing: ', otherStrategies.toArray());
    otherStrategies.forEach(db.matchup(strategy));
    callback();
  };
};
