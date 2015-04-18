REPORTER = spec

test:
	@$(MAKE) lint
	@echo TRAVIS_JOB_ID $(TRAVIS_JOB_ID)
	@NODE_ENV=test ./node_modules/.bin/mocha -b --recursive --reporter $(REPORTER)
	@NODE_ENV=test ./node_modules/.bin/istanbul cover ./node_modules/mocha/bin/_mocha -- --recursive
	./node_modules/.bin/istanbul check-coverage --statements 100 --branches 100 --functions 100 --lines 100 ./coverage/coverage.json

lint:
	./node_modules/.bin/eslint .

test-cov:
	$(MAKE) lint
	@NODE_ENV=test ./node_modules/.bin/istanbul cover \
	./node_modules/mocha/bin/_mocha -- -R spec

test-coveralls:
	@NODE_ENV=test ./node_modules/.bin/istanbul cover \
	./node_modules/mocha/bin/_mocha --report lcovonly -- -R spec && \
	cat ./coverage/lcov.info | ./node_modules/coveralls/bin/coveralls.js --verbose

.PHONY: test
