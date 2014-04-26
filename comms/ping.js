var debug = require('debug')('dilemma:comms:ping');
var ts = require('monotonic-timestamp');
var bt = require('buffertools');

module.exports = function(socket) {
  return function(target, callback) {
    var tick = ts();
    var timer = setTimeout(pingTimeout, 3000);
    var pinger;

    function handleMessage(source, envelope, msgType) {
      if (bt.equals(target, source) && msgType.toString() === 'pong') {
        debug('confirmed runner ' + target.toString('hex') + ' is alive');
        socket.removeListener('message', handleMessage);
        clearTimeout(timer);
        clearTimeout(pinger);

        return callback();
      }
    }

    function ping() {
      socket.send([target, '', 'ping', ts()]);
      pinger = setTimeout(ping, 500);
    }

    function pingTimeout() {
      debug('timing out ping for target: ' + target);
      clearTimeout(pinger);
      socket.removeListener('message', handleMessage);
      callback(new Error('timed out'));
    }

    debug('attempting to ping worker: ' + target);
    socket.on('message', handleMessage);
    ping();
  };
};
