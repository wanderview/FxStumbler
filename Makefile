default: help

help:
	@echo "help   - display this text"
	@echo "all    - compile zip file"

all: zip

zip: 
	test -s lib/localForage/.git || ( git submodule update --init --recursive && git submodule foreach git pull origin master )
	rm stumbler.zip
	zip -r stumbler.zip index.html js lib locales manifest.webapp style

