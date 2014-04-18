var debug = require('debug')('dilemma:matchup');
var length = require('whisk/length');
var pluck = require('whisk/pluck');

module.exports = function(iterations, a, b) {
  function handleResult() {
    var counts = [a, b].map(pluck('results')).map(length);
    if (counts[0] === counts[1]) {
      if (counts[0] < iterations) {
        iterate();
      }
      else {
        finish();
      }
    }
  }

  function iterate() {
    [a, b].forEach(function(challenger) {
      challenger.run();
    });
  }

  function finish() {
    debug('finished');
    [a, b].map(function(challenger) {
      challenger.send('end');
    });
  }

  debug('running matchup: ', a.name, b.name);
  [a, b].forEach(function(challenger) {
    challenger.on('result', handleResult).run();
  });
};
