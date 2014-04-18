var debug = require('debug')('dilemma:queue');
var EventEmitter = require('events').EventEmitter;
var ts = require('monotonic-timestamp');
var pl = require('pull-level');
var pull = require('pull-stream');

/* jshint node: true */
module.exports = function(server, db, opts) {
  var store = db.sublevel('jobs');
  var queue = {};

  queue.read = function() {
    return pl.live(store, { tail: true });
  };

  queue.add = function(jobType) {
    debug('queuing job: ' + jobType);
    store.put(
      [ ts(), jobType ].join('|'),
      JSON.stringify([].slice.call(arguments, 1))
    );
  };

  return queue;
};
