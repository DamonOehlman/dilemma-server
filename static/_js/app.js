var source = new EventSource('/data/matchups');
var jsonparse = require('cog/jsonparse');

source.addEventListener('message', function(evt) {
  console.log('got data: ', jsonparse(evt.data));
});

source.addEventListener('error', function(evt) {
  console.log('encountered error: ', evt, arguments);
});
