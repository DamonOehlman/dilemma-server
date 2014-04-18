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

  // initialise the strategies sublevel
  db.strategyStore = db.sublevel('strategies');

  // initialise the in-memory set of strategies
  db.strategies = new SortedSet();

  // initialise the log sublevel
  db.log = function(entryType, text) {
    log.put([ ts(), entryType ].join('|'), text);
  };

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

  pull(
    pl.live(db.strategyStore, { tail: true }),
    pull.drain(function(item) {
      queue.add('runStrategy', item.key);
      server.emit('strategy', item);
    })
  );

  return db;
};
