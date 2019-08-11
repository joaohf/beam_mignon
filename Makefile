.PHONY: all clean server

HUGO := hugo

# Below are PHONY targets
all: server

clean:
	-rm -rf public

server: clean
	$(HUGO) server -D -F
