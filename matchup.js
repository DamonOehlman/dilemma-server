var async = require('async');
var config = require('./config');
var debug = require('debug')('dilemma:matchup');
var length = require('whisk/length');
var pluck = require('whisk/pluck');
var pull = require('pull-stream');
var ts = require('monotonic-timestamp');
var List = require('collections/list');
var zip = require('whisk/zip');

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
    async.map(strategies, db.getStrategy, function(err, endpoints) {
      // if the strategy does not exist, then remove the matchup
      if (err && err.notFound) {
        debug('could not find strategies for matchup, removing matchup');
        db.matchups.del(item.key);
        return read(null, next);
      }

      // ping the strategy runners
      async.map(endpoints, server.comms.ping, function(err, responses) {
        // if the strategy runners are not available, then skip
        if (err) {
          debug('could not communicate with strategy runners, removing matchup');
          db.matchups.del(item.key);
          return read(null, next);
        }

        process(item, strategies, endpoints);
      });
    });
  }

  function process(item, strategies, endpoints) {
    var results = [ new List(), new List() ];

    function challenge(idx, callback) {
      var opponent = results[idx ^ 1];

      server.comms.iterate(
        endpoints[idx],
        opponent.length > 0 ? opponent.one() : '',
        function(err, result) {
          if (err) {
            return callback(err);
          }

          results[idx].unshift(result);
          callback();
        }
      );
    }

    function iterate(iteration, callback) {
      async.times(endpoints.length, challenge, callback);
    }

    debug('commencing iteration');
    async.timesSeries(config.iterations, iterate, function(err) {
      var zipped = results[0].toArray().map(zip(results[1].toArray()));
      debug('completed matchup: ' + item.key);

      console.log(zipped);

      // set the item results
      db.matchups.put(item.key, JSON.stringify({
        res0: results[0].toArray().join(''),
        res1: results[1].toArray().join('')
      }));

      read(err, next);
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
