var d3 = require('d3');
var formatter = require('formatter');
var jsonparse = require('cog/jsonparse');
var statsItem = formatter('<label class="strategy">{{ 0 }}</label>{{ 1 }}');
var pluck = require('whisk/pluck');
var stats = [];

function createStatsItem(d) {
  return statsItem(d.key, d.value.average);
}

function processStats(evt) {
  var data = jsonparse(evt.data);

  // get the current stats without the updated item
  var current = stats.filter(function(item) {
    return item.key !== data.key;
  });

  stats = current.concat(data).sort(function(a, b) {
    return d3.ascending(a.value.average, b.value.average);
  });

  updateStats();
}

function updateStats() {
  var strategies = d3.select('#strategies').selectAll('div')
    .data(stats, function(d) {
      return d.key;
    });

  // update implementation
  strategies.text(pluck('value.average'));

  // enter implementation
  strategies
    .enter()
    .append('div')
      .attr('data-label', pluck('key'))
      .text(pluck('value.average'))

  // exit implementation
  strategies.exit().remove();

  // order the items
  strategies.order();
}

new EventSource('/data/stats').addEventListener('message', processStats);
// new EventSource('/data/matchups').addEventListener('message', processMatchup);
