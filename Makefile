default: help

help:
	@echo "help   - display this text"
	@echo "all    - compile zip file"

all: zip

zip: 
	rm stumbler.zip
	zip -r stumbler.zip index.html js lib locales manifest.webapp style

