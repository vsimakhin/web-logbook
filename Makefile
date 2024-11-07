PORT=4000
ENV=dev

XC_OS ?= linux darwin windows
XC_ARCH ?= amd64 arm64 arm
BIN="./dist"
BINARY_NAME="web-logbook"
OPTIONS=-ldflags="-s -w" -trimpath

## clean: cleans all binaries and runs go clean
clean:
	@echo "Cleaning..."
	@- rm -rf dist/*
	@go clean
	@echo "Cleaned!"

fmt:
	@go fmt ./...

## tests
test: fmt
	@go test -v ./... -coverpkg=./...

## build: builds the binaty
build: clean
	@echo "Building..."
	@go build -ldflags="-s -w" -o dist/web-logbook ./app
	@echo "Web-logbook built!"

## start: starts the web-logbook
start: build
	@echo "Starting the app..."
	@env ./dist/web-logbook -port=${PORT} -env="${ENV}"

start_tls: build
	@echo "Starting the app with https enabled..."
	@env ./dist/web-logbook -port=${PORT} -env="${ENV}" -enable-https

build_linux_amd64:
	@OS=linux; ARCH=amd64; \
	echo Building $$OS/$$ARCH to $(BIN)/$(BINARY_NAME)-$$OS-$$ARCH; \
	CGO_ENABLED=0 GOOS=$$OS GOARCH=$$ARCH \
	go build $(OPTIONS) -o=$(BIN)/$(BINARY_NAME)-$$OS-$$ARCH/$(BINARY_NAME) ./app; \
	cd $(BIN); tar czf $(BINARY_NAME)-$$OS-$$ARCH.tar.gz $(BINARY_NAME)-$$OS-$$ARCH;

build_linux_arm64:
	@OS=linux; ARCH=arm64; \
	echo Building $$OS/$$ARCH to $(BIN)/$(BINARY_NAME)-$$OS-$$ARCH; \
	CGO_ENABLED=0 GOOS=$$OS GOARCH=$$ARCH \
	go build $(OPTIONS) -o=$(BIN)/$(BINARY_NAME)-$$OS-$$ARCH/$(BINARY_NAME) ./app; \
	cd $(BIN); tar czf $(BINARY_NAME)-$$OS-$$ARCH.tar.gz $(BINARY_NAME)-$$OS-$$ARCH;

build_linux_arm_6:
	@OS=linux; ARCH=arm; ARM=6; \
	echo Building $$OS/$$ARCH to $(BIN)/$(BINARY_NAME)-$$OS-$$ARCH-$$ARM; \
	CGO_ENABLED=0 GOOS=$$OS GOARCH=$$ARCH GOARM=$$ARM \
	go build $(OPTIONS) -o=$(BIN)/$(BINARY_NAME)-$$OS-$$ARCH-$$ARM/$(BINARY_NAME) ./app; \
	cd $(BIN); tar czf $(BINARY_NAME)-$$OS-$$ARCH-$$ARM.tar.gz $(BINARY_NAME)-$$OS-$$ARCH-$$ARM;

build_linux_arm_7:
	@OS=linux; ARCH=arm; ARM=7; \
	echo Building $$OS/$$ARCH to $(BIN)/$(BINARY_NAME)-$$OS-$$ARCH-$$ARM; \
	CGO_ENABLED=0 GOOS=$$OS GOARCH=$$ARCH GOARM=$$ARM \
	go build $(OPTIONS) -o=$(BIN)/$(BINARY_NAME)-$$OS-$$ARCH-$$ARM/$(BINARY_NAME) ./app; \
	cd $(BIN); tar czf $(BINARY_NAME)-$$OS-$$ARCH-$$ARM.tar.gz $(BINARY_NAME)-$$OS-$$ARCH-$$ARM;

build_darwin_amd64:
	@OS=darwin; ARCH=amd64; \
	echo Building $$OS/$$ARCH to $(BIN)/$(BINARY_NAME)-$$OS-$$ARCH; \
	CGO_ENABLED=0 GOOS=$$OS GOARCH=$$ARCH \
	go build $(OPTIONS) -o=$(BIN)/$(BINARY_NAME)-$$OS-$$ARCH/$(BINARY_NAME) ./app; \
	cd $(BIN); tar czf $(BINARY_NAME)-$$OS-$$ARCH.tar.gz $(BINARY_NAME)-$$OS-$$ARCH;

build_darwin_arm64:
	@OS=darwin; ARCH=arm64; \
	echo Building $$OS/$$ARCH to $(BIN)/$(BINARY_NAME)-$$OS-$$ARCH; \
	CGO_ENABLED=0 GOOS=$$OS GOARCH=$$ARCH \
	go build $(OPTIONS) -o=$(BIN)/$(BINARY_NAME)-$$OS-$$ARCH/$(BINARY_NAME) ./app; \
	cd $(BIN); tar czf $(BINARY_NAME)-$$OS-$$ARCH.tar.gz $(BINARY_NAME)-$$OS-$$ARCH;

build_windows_amd64:
	@OS=windows; ARCH=amd64; \
	echo Building $$OS/$$ARCH to $(BIN)/$(BINARY_NAME)-$$OS-$$ARCH; \
	CGO_ENABLED=0 GOOS=$$OS GOARCH=$$ARCH \
	go build $(OPTIONS) -o=$(BIN)/$(BINARY_NAME)-$$OS-$$ARCH/$(BINARY_NAME) ./app; \
	cd $(BIN); mv $(BINARY_NAME)-$$OS-$$ARCH/$(BINARY_NAME) $(BINARY_NAME)-$$OS-$$ARCH/$(BINARY_NAME).exe; zip -r $(BINARY_NAME)-$$OS-$$ARCH.zip $(BINARY_NAME)-$$OS-$$ARCH; 

build_all: test clean build_linux_amd64 build_linux_arm64 build_linux_arm_6 build_linux_arm_7 build_darwin_amd64 build_darwin_arm64 build_windows_amd64
