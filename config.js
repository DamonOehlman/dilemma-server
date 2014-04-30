// initialise the default port the webserver will listen on
exports.ports = {
  http: 1442,
  zmq: 1441
};

// initialise the number of iterations that should be completed for a matchup
exports.iterations = 1000;

// initialise the years that will be served by each party in cases
exports.scores = {
  'DD': [ 3, 3 ], // both betray
  'CD': [ 5, 0 ], // a remain silent, b betray
  'DC': [ 0, 5 ], // a betray, b remain silent
  'CC': [ 1, 1 ], // both remain silent

  // BS variants
  'BB': [ 3, 3 ], // both betray
  'SB': [ 5, 0 ], // a remain silent, b betray
  'BS': [ 0, 5 ], // a betray, b remain silent
  'SS': [ 1, 1 ]  // both remain silent
};
