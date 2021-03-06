var mods = ['reg'];

module.exports = function(socket, db) {
  var actions = {};

  mods.forEach(function(mod) {
    actions[mod] = require('./' + mod + '.js')(socket, db);
  });

  return actions;
};
