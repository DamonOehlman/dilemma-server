var mods = ['checkStrategy', 'runStrategy'];

module.exports = function(server, db) {
  var processors = {};

  mods.forEach(function(mod) {
    processors[mod] = require('./' + mod + '.js')(server, db);
  });

  return processors;
};
