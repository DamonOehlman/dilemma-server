var async = require('async');
var debug = require('debug')('dilemma:checkStrategy');

module.exports = function(server, db) {
  return function(strategy, callback) {
    // get the strategies not including the current strategy
    var otherStrategies = db.strategies.filter(function(name) {
      return name !== strategy;
    });

    function foundMatchup(other, callback) {
      var key = [strategy, other].sort().join('|');
      var found = false;

      db.matchups.createReadStream({ start: key, limit: 1 })
        .on('data', function(data) {
          found = true;
        })
        .on('end', function() {
          callback(found);
        });
    }

    // find matchups that don't have a matchup queued
    async.reject(otherStrategies.toArray(), foundMatchup, function(results) {
      results.forEach(db.matchup(strategy));
      callback();
    });
  };
};
