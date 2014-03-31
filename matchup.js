var debug = require('debug')('dilemma-server');

module.exports = function(a, b) {
  debug('running matchup: ', a.name, b.name);

  a.run();
  b.run();
  // a.socket.send('hello');
  // b.socket.send('hello');
};