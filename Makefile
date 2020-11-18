src_files = $(wildcard src/*)

build: bin/bundle.js bin/index.html

run:
	cd bin && python3 -m http.server

bin:
	mkdir -p bin

clean:
	rm -rf bin

bin/bundle.js: $(src_files)
	browserify src/App.js > bin/bundle.js

bin/index.html: src/template.html
	cp src/template.html bin/index.html
