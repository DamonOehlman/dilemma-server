module.exports = function(socket, db) {
  return function(source, result) {
    // find the specified challenger
    var challenger = db.active.filter(function(chal) {
      return chal.source === source;
    })[0];

    if (challenger) {
      challenger.addResult(result);
    }
  };
};
