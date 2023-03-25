PORT=4000
ENV=dev

XC_OS ?= linux darwin windows
XC_ARCH ?= amd64 arm64 arm
BIN="./dist"
BINARY_NAME="web-logbook"

## clean: cleans all binaries and runs go clean
clean:
	@echo "Cleaning..."
	@- rm -rf dist/*
	@go clean
	@echo "Cleaned!"

## tests
test:
	@go test -v ./... -coverpkg=./...

## build: builds the binaty
build: clean
	@echo "Building..."
	@go build -ldflags="-s -w" -o dist/web-logbook ./cmd/web
	@echo "Web-logbook built!"

## start: starts the web-logbook
start: build
	@echo "Starting the app..."
	@env ./dist/web-logbook -port=${PORT} -env="${ENV}"

start_tls: build
	@echo "Starting the app with https enabled..."
	@env ./dist/web-logbook -port=${PORT} -env="${ENV}" -enable-https

build_all: test clean
	@echo "Building everything..."
	@for OS in $(XC_OS); do \
		for ARCH in $(XC_ARCH); do \
			[ $$OS = "windows" ] && [ $$ARCH = "arm64" ] && continue; \
			[ $$OS != "linux" ] && [ $$ARCH = "arm" ] && continue; \
			echo Building $$OS/$$ARCH to $(BIN)/$(BINARY_NAME)-$$OS-$$ARCH; \
			CGO_ENABLED=0 \
			GOOS=$$OS \
			GOARCH=$$ARCH \
			go build -ldflags="-s -w" -trimpath \
			-o=$(BIN)/$(BINARY_NAME)-$$OS-$$ARCH/$(BINARY_NAME) ./cmd/web; \
			[ $$OS = "windows" ] && (cd $(BIN); mv $(BINARY_NAME)-$$OS-$$ARCH/$(BINARY_NAME) $(BINARY_NAME)-$$OS-$$ARCH/$(BINARY_NAME).exe; zip -r $(BINARY_NAME)-$$OS-$$ARCH.zip $(BINARY_NAME)-$$OS-$$ARCH; cd ../) \
				|| (cd $(BIN); tar czf $(BINARY_NAME)-$$OS-$$ARCH.tar.gz $(BINARY_NAME)-$$OS-$$ARCH; cd ../) ;\
		done ; \
	done