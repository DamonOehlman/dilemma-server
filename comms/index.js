var mods = ['send'];

module.exports = function(socket) {
  var comms = {};

  mods.forEach(function(mod) {
    comms[mod] = require('./' + mod + '.js')(socket);
  });

  return comms;
};
