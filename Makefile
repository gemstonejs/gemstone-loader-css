##
##  GemstoneJS -- Gemstone JavaScript Technology Stack
##  Copyright (c) 2016-2017 Gemstone Project <http://gemstonejs.com>
##  Licensed under Apache License 2.0 <https://spdx.org/licenses/Apache-2.0>
##

NPM = npm

all: build

bootstrap:
	@if [ ! -d node_modules ]; then $(NPM) install; fi

build: bootstrap
	@$(NPM) run prepublishOnly

clean: bootstrap

distclean: bootstrap
	-rm -rf node_modules

