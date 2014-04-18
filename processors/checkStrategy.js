var debug = require('debug')('dilemma:checkStrategy');

module.exports = function(server, db) {
  return function(strategy, callback) {
    debug('checking strategy: ' + strategy);
    callback();
  };
};
