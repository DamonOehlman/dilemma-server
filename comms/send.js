var debug = require('debug')('dilemma:comms:send');
var bt = require('buffertools');

module.exports = function(socket) {
  return function() {
    var args = [].slice.call(arguments);

    function toString(target) {
      return typeof target.toString == 'function' ? target.toString() : target;
    }

    return function(target, callback) {
      var timer = setTimeout(handleTimeout, 3000);

      function handleMessage(source, envelope) {
        var payload = [].slice.call(arguments, 2).map(toString);

        if (bt.equals(target, source)) {
          clearTimeout(timer);
          socket.removeListener('message', handleMessage);
          return callback.apply(null, [null].concat(payload));
        }
      }

      function handleTimeout() {
        debug('timing out communication with target: ' + target.toString('hex'));
        clearTimeout(timer);
        socket.removeListener('message', handleMessage);

        callback(new Error('timed out'));
      }

      socket.on('message', handleMessage);
      socket.send([target, ''].concat(args));
    };
  };
};
