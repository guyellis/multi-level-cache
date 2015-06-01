# Change Log

# 0.0.14

* Remove packed directory from Npmjs (no functional changes)

# 0.0.13

* `stats` - new API method

# 0.0.12

* `set()` now requires a callback
* Remove disabled option
* Redis manages errors internally and exposes through API on next call.

# 0.0.11

* Added in default TTL options to pass to the cache

# 0.0.10

* Added ability to set redis host/port via options

# 0.0.9

* Fix test errors caused by Redis error event-emitter
* Add flushAll()

# 0.0.8

* Fix date deserialization bug in Redis

# 0.0.7

* Redis implementation completed
* Integration tests with Redis completed/fixed.

# 0.0.6

* Make KeyNotFound its own custom Error type derived from MultiError called KeyNotFoundError
* Fix paths for tool references in package.json

# 0.0.5

* Switch from JSHint to ESLint
* Add a custom Error object: MultiError.
* If key is not present in cache then `get()` will return a MultiError with
  keyNotFound set to true.
* Optional integration testing added.
* Add ability to disable the cache.

# 0.0.4

* Improved tests
* Test coverage to 100%
* Lock down dependency versions
* Remove test code from redis wrapper

# 0.0.3

* Add documentation

# 0.0.2

* Small bug fix
* Add tests
* Add documentation

# 0.0.1

* Initial commit
* Basic API includes 3 methods `set`, `get`, `del`
