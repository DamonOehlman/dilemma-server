var debug = require('debug')('dilemma:processor');
var pull = require('pull-stream');

module.exports = pull.Sink(function(read, server, db, done) {
  var processors = require('./processors')(server, db);

  function next(end, item) {
    var parts;
    var processor;

    if (end) {
      return (done || function() {})(end);
    }

    // split the item key into parts
    parts = item.key.split('|');

    // look for the processor for the job type
    processor = processors[parts[1]];

    // if we have a processor, then run it
    if (typeof processor == 'function') {
      var args = JSON.parse(item.value);

      processor.apply(null, args.concat(function(err) {
      }));

      // drain
      read(null, next);
    }
    // otherwise, we have no processor so add a debug warning
    else {
      debug('no processor found for job: ' + parts[1]);
      process.nextTick(function() {
        read(null, next);
      });
    }
  }

  read(null, next);
});
