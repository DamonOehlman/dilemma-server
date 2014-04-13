var Strategy = require('dilemma/strategy');

module.exports = function() {
  var strategy = new Strategy({
    title: 'always-betray'
  });

  strategy
    .connect()
    .on('exec', function() {
      this.submit('D')
    });

  return strategy;
};
