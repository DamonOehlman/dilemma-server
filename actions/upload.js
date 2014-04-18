var debug = require('debug')('dilemma:action-upload');

module.exports = function(socket, db) {
  return function(source, result) {
    // find the specified challenger
    var challenger = db.active.filter(function(chal) {
      return chal.source === source;
    }).one();

    debug('running upload action for challenger: ', challenger);
    if (challenger) {
      challenger.addResult(result);
    }
  };
};
