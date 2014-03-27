var runner = require('dilemma')('always-trust');

module.exports = runner(function() {
  this.submit('C');
});