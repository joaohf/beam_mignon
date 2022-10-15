.PHONY: all clean server build

HUGO := ./hugo
PRETTIER := prettier
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
	$(PRETTIER) --write content
	$(HUGO) --gc --minify --enableGitInfo --cleanDestinationDir -b $(DEPLOY_PRIME_URL)