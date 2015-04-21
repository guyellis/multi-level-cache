# Contributing to Multi-Level-Cache

We'd love for you to contribute to our source code and to make Multi-Level-Cache even better.

## Adapters

If you have created a new adapter for a cache that's not supported then you will need to
validate it by adding it to the array of caches in the test.multi.js file and run the
tests with:
 
```
NODE_MULTICACHE_TESTTYPE="integration" npm test
```

## Adding a new method to all Adapters

[This commit]() is a good example of how the flushAll() method was added to the project.
Use this as a template if you plan on adding a new method. Remember it has to be implemented
for each adapter.
