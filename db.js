var levelup = require('levelup');
var sublevel = require('level-sublevel');
var pull = require('pull-stream');
var pl = require('pull-level');
var ts = require('monotonic-timestamp');

module.exports = function(opts) {
  var db = sublevel(levelup('./dilemma-data'));
  var log = db.sublevel('log');

  // initialise the strategies sublevel
  db.strategies = db.sublevel('strategies');

  // initialise the log sublevel
  db.log = function(entryType, text) {
    log.put([ ts(), entryType ].join(':'), text);
  };

  // TODO: read the strategies registered

  pull(
    pl.live(db.strategies, { tail: true }),
    pull.log()
  );

  return db;
};
