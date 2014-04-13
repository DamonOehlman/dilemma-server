var Strategy = require('dilemma/strategy');

module.exports = function() {
  var strategy = new Strategy({
    title: 'always-trust'
  });

  strategy
    .connect()
    .on('exec', function() {
      this.submit('C')
    });

  return strategy;
};
