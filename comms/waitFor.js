var debug = require('debug')('dilemma:comms:send');
var bt = require('buffertools');

module.exports = function(socket) {
  return function(expectedCommand) {
    var args = [].slice.call(arguments, 1);

    function toString(target) {
      return typeof target.toString == 'function' ? target.toString() : target;
    }

    return function(target, callback) {
      var timer = setTimeout(handleTimeout, 3000);

      function handleMessage(source, envelope, command) {
        var payload = [].slice.call(arguments, 3).map(toString);

        if (bt.equals(target, source) && command && command.toString() === expectedCommand) {
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
