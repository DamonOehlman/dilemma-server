var debug = require('debug')('dilemma:db');
var levelup = require('levelup');
var sublevel = require('level-sublevel');
var pull = require('pull-stream');
var pl = require('pull-level');
var ts = require('monotonic-timestamp');
var SortedSet = require('collections/sorted-set');
var throttle = require('cog/throttle');
var Combinatorics = require('js-combinatorics').Combinatorics;
var pluck = require('whisk/pluck');

module.exports = function(server, opts) {
  var db = sublevel(levelup('./dilemma-data'));
  var log = db.sublevel('log');
  var jobs = db.sublevel('jobs');
  var queue = server.queue = require('./queue')(server, db, opts);

  function invalidatePriorMatchups(key) {
    var start = key.split('|').slice(0, 2).join('|');

    db.matchups.createReadStream({ start: start, end: key })
      .on('data', function(item) {
        if (item.key !== key && item.value === 'TBA') {
          db.matchups.put(item.key, 'CANCELLED');
        }
      });
  }

  // initialise the strategies sublevel
  db.strategyStore = db.sublevel('strategies');

  // create a matchup sublevel store
  db.matchups = db.sublevel('matchups', { valueEncoding: 'json' });

  // create a stats sublevel
  db.stats = db.sublevel('stats', { valueEncoding: 'json' });

  // initialise the in-memory set of strategies
  db.strategies = new SortedSet();

  // initialise the log sublevel
  db.log = function(entryType, text) {
    log.put([ ts(), entryType ].join('|'), text);
  };

  db.matchup = function(a, b) {
    function insert(b) {
      var key = [ a, b ].sort().concat(ts()).join('|');

      invalidatePriorMatchups(key);
      return db.matchups.put(key, { state: 'queued' });
    };

    return b ? insert(a, b) : insert;
  };

  // create a getStrategy bound function
  db.getStrategy = db.strategyStore.get.bind(db.strategyStore);

  // read the existing strategies and ensure that we have run combinations for them
  pull(
    pl.read(db.strategyStore),
    pull.collect(function(err, values) {
      if (err) {
        return;
      }

      // update the strategies
      db.strategies = db.strategies.concat(values.map(pluck('key')));

      // for each of the strategies queue up a check operation
      db.strategies.forEach(function(value) {
        queue.add('checkStrategy', value);
      });
    })
  );

  // process any pending matchups
  pull(
    pl.read(db.matchups, { tail: true }),
    require('./matchup')(server, db)
  );

  // calculate stats averages on change
  pull(
    pl.read(db.stats, { tail: true }),
    require('./sinks/calc-stats')(db)
  );

  pull(
    pl.live(db.strategyStore, { tail: true }),
    pull.drain(function(item) {
      db.strategies.push(item.key);
      queue.add('runStrategy', item.key);
      server.emit('strategy', item);
    })
  );

  return db;
};
