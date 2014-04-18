var async = require('async');
var debug = require('debug')('dilemma:matchup');
var length = require('whisk/length');
var pluck = require('whisk/pluck');
var pull = require('pull-stream');
var ts = require('monotonic-timestamp');

module.exports = pull.Sink(function(read, server, db, done) {
  function next(end, item) {
    var strategies;
    var processor;

    if (end) {
      return (done || function() {})(end);
    }

    // if the matchup has been completed, then leave it
    if (item.value !== 'TBA') {
      return read(null, next);
    }

    // get the strategies
    strategies = item.key.split('|').slice(0, 2);
    async.map(strategies, db.getStrategy, function(err, results) {
      // if the strategy does not exist, then remove the matchup
      if (err && err.notFound) {
        debug('could not find strategies for matchup, removing matchup');
        db.matchups.del(item.key);
        return read(null, next);
      }

      debug('processing matchup: ', results);
      return read(null, next)
    });
  }

  read(null, next);
});

// module.exports = function(iterations, a, b) {
//   function handleResult() {
//     var counts = [a, b].map(pluck('results')).map(length);
//     if (counts[0] === counts[1]) {
//       if (counts[0] < iterations) {
//         iterate();
//       }
//       else {
//         finish();
//       }
//     }
//   }

//   function iterate() {
//     [a, b].forEach(function(challenger) {
//       challenger.run();
//     });
//   }

//   function finish() {
//     debug('finished');
//     [a, b].map(function(challenger) {
//       challenger.send('end');
//     });
//   }

//   debug('running matchup: ', a.name, b.name);
//   [a, b].forEach(function(challenger) {
//     challenger.on('result', handleResult).run();
//   });
// };
