.PHONY: all clean server build

HUGO := ./hugo
HUGO_RELEASE := https://github.com/joaohf/hugo/releases/download/v0.104.1-diminish/hugo
DEPLOY_PRIME_URL := https://beam-mignon.netlify.app/

# Below are PHONY targets
all: server

fetch:
	wget -qN $(HUGO_RELEASE) && chmod 755 ./hugo

clean:
	-rm -rf public

server: clean
	$(HUGO) server -D -F

build:
	$(HUGO) --gc --minify --enableGitInfo -b $(DEPLOY_PRIME_URL)