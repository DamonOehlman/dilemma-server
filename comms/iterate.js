var debug = require('debug')('dilemma:comms:iterate');
var ts = require('monotonic-timestamp');

module.exports = function(socket) {
  return function(target, opponentLast, callback) {
    var pinger;

    function handleMessage(source, envelope, msgType, response) {
      if (source.toString() === target && msgType.toString() === 'result') {
        socket.removeListener('message', handleMessage);
        return callback(null, response.toString());
      }
    }

    socket.on('message', handleMessage);
    socket.send([target, '', 'iterate', opponentLast]);
  };
};
