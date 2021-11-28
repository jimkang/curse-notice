include config.mk

HOMEDIR = $(shell pwd)

pushall: sync
	git push origin master

deploy:
	npm version patch && make build && make pushall

prettier:
	prettier --single-quote --write "**/*.html"

build:
	./node_modules/.bin/rollup -c

build-unminified:
	UNMINIFY=1 ./node_modules/.bin/rollup -c

sync:
	rsync -a public/ $(USER)@$(SERVER):$(APPDIR)

set-up-server-dir:
	ssh $(USER)@$(SERVER) "mkdir -p $(APPDIR)/build"

run:
	./node_modules/.bin/rollup -c -w
