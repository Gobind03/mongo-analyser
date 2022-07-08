# Roadmap

## Features to be implemented
1. Implement an option similar to `-allinfo` option that would analyse the following
 - serverStatus
 - db.stats()
 - db.<collection>.stats()
 - rs.conf()
 - rs.status()
 - cache view

2. Indexing analysis (Grouped By Collection) (Fragmentation)
  - IndexStats
  - unused indexes
  - redundant indexes
  
3. Chunk Distribution and Shard Status analysis


# Arch
1. LogParser 
2. Driver Connection
3. State Machine
  3.1 With an API that can allo processed files + compression
4. DI Architecture


