# Results Storage

## Option 1: Redis

### Matchup Storage

- Create three entities per matchup:
  - one hash containing the core information for the matchup
  - two sets for each of the matchup competitors results

### Strategy Storage

Each strategy should be comprised of a list / set, and each element refers to a version of the strategy.  Each strategy is created with a unique id (uuid) that will be used to track it's matchup results.  Only the latest version of a strategy will be considered in contests, but results for all strategies will be available thanks to matchups being stored using a strategy:version id combination.

## Option 2: CouchDB

-
