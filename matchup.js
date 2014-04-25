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

    switch (item.value && item.value.state) {
      case 'queued': {
        return compete(item);
      }

      case 'precalc': {
        return calcScores(item);
      }

      default: {
        debug('nothing to do for matchup: ' + item.key + ', skipping');
        return read(null, next);
      }
    }
  }

  function calcScores(item) {
    var results = item.value && item.value.results;
    var unpackedResults;
    var zipped;
    var scores;

    debug('calculating scores for match up: ' + item.key);

    // convert results back to array values
    unpackedResults = results.map(function(res) {
      return [].slice.call(res);
    });

    // zip the results together
    zipped = unpackedResults[0].map(zip(unpackedResults[1]));

    // calculate the score
    scores = zipped.map(function(choices) {
      return config.scores[choices.join('')];
    });

    db.matchups.put(item.key, {
      state: 'complete',
      results: results,
      timeServed: scores.reduce(function(memo, item) {
        return [ memo[0] + item[0], memo[1] + item[1] ];
      }, [0, 0])
    });

    read(null, next);
  }

  function compete(item) {
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
      debug('completed matchup: ' + item.key);
      db.matchups.put(item.key, {
        state: 'precalc',
        results: results.map(function(res) {
          return res.reverse().toArray().join('');
        })
      });

      read(err, next);
    });
  }

  read(null, next);
});
