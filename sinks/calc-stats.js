var debug = require('debug')('dilemma:calc-stats');
var extend = require('cog/extend');
var pull = require('pull-stream');

module.exports = pull.Sink(function(read, db, done) {
 function next(end, item) {
   var vs = item.value.vs || {};
   var vsStrategies = Object.keys(vs);
   var average = (vsStrategies.reduce(function(memo, key) {
     return memo + vs[key];
   }, 0) / vsStrategies.length) | 0;

   // if the calculated average is different to what is stored, then update
   if (average === item.value.average) {
     return read(null, next);
   }

   debug('updating average stats calculation for stategy ' + item.key, average);
   db.stats.put(item.key, extend(item.value, { average: average }), function() {
     read(null, next);
   });
 }

 read(null, next);
});
