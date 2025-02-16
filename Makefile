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

npm_install:
	@echo "Installing npm packages..."
	@cd app/ui && npm install
	@cd ../../

## build ui
build_ui:
	@echo "Building UI..."
	@cd app/ui && npm run build
	@cd ../../

## tests
test: fmt
	@go test -v ./... -coverpkg=./...

## build: builds the binary
build_backend: clean
	@echo "Building..."
	@go build -ldflags="-s -w" -o dist/web-logbook ./app
	@echo "Web-logbook built!"

## start: starts the web-logbook
start: build_ui build_backend
	@echo "Starting the app..."
	@env ./dist/web-logbook -port=${PORT} -env="${ENV}"

start_backend: clean build_backend
	@echo "Starting the app..."
	@env ./dist/web-logbook -port=${PORT} -env="${ENV}"

build_linux_amd64: build_ui
	@OS=linux; ARCH=amd64; \
	echo Building $$OS/$$ARCH to $(BIN)/$(BINARY_NAME)-$$OS-$$ARCH; \
	CGO_ENABLED=0 GOOS=$$OS GOARCH=$$ARCH \
	go build $(OPTIONS) -o=$(BIN)/$(BINARY_NAME)-$$OS-$$ARCH/$(BINARY_NAME) ./app; \
	cd $(BIN); tar czf $(BINARY_NAME)-$$OS-$$ARCH.tar.gz $(BINARY_NAME)-$$OS-$$ARCH;

build_linux_arm64: build_ui
	@OS=linux; ARCH=arm64; \
	echo Building $$OS/$$ARCH to $(BIN)/$(BINARY_NAME)-$$OS-$$ARCH; \
	CGO_ENABLED=0 GOOS=$$OS GOARCH=$$ARCH \
	go build $(OPTIONS) -o=$(BIN)/$(BINARY_NAME)-$$OS-$$ARCH/$(BINARY_NAME) ./app; \
	cd $(BIN); tar czf $(BINARY_NAME)-$$OS-$$ARCH.tar.gz $(BINARY_NAME)-$$OS-$$ARCH;

build_linux_arm_6: build_ui
	@OS=linux; ARCH=arm; ARM=6; \
	echo Building $$OS/$$ARCH to $(BIN)/$(BINARY_NAME)-$$OS-$$ARCH-$$ARM; \
	CGO_ENABLED=0 GOOS=$$OS GOARCH=$$ARCH GOARM=$$ARM \
	go build $(OPTIONS) -o=$(BIN)/$(BINARY_NAME)-$$OS-$$ARCH-$$ARM/$(BINARY_NAME) ./app; \
	cd $(BIN); tar czf $(BINARY_NAME)-$$OS-$$ARCH-$$ARM.tar.gz $(BINARY_NAME)-$$OS-$$ARCH-$$ARM;

build_linux_arm_7: build_ui
	@OS=linux; ARCH=arm; ARM=7; \
	echo Building $$OS/$$ARCH to $(BIN)/$(BINARY_NAME)-$$OS-$$ARCH-$$ARM; \
	CGO_ENABLED=0 GOOS=$$OS GOARCH=$$ARCH GOARM=$$ARM \
	go build $(OPTIONS) -o=$(BIN)/$(BINARY_NAME)-$$OS-$$ARCH-$$ARM/$(BINARY_NAME) ./app; \
	cd $(BIN); tar czf $(BINARY_NAME)-$$OS-$$ARCH-$$ARM.tar.gz $(BINARY_NAME)-$$OS-$$ARCH-$$ARM;

build_darwin_amd64: build_ui
	@OS=darwin; ARCH=amd64; \
	echo Building $$OS/$$ARCH to $(BIN)/$(BINARY_NAME)-$$OS-$$ARCH; \
	CGO_ENABLED=0 GOOS=$$OS GOARCH=$$ARCH \
	go build $(OPTIONS) -o=$(BIN)/$(BINARY_NAME)-$$OS-$$ARCH/$(BINARY_NAME) ./app; \
	cd $(BIN); tar czf $(BINARY_NAME)-$$OS-$$ARCH.tar.gz $(BINARY_NAME)-$$OS-$$ARCH;

build_darwin_arm64: build_ui
	@OS=darwin; ARCH=arm64; \
	echo Building $$OS/$$ARCH to $(BIN)/$(BINARY_NAME)-$$OS-$$ARCH; \
	CGO_ENABLED=0 GOOS=$$OS GOARCH=$$ARCH \
	go build $(OPTIONS) -o=$(BIN)/$(BINARY_NAME)-$$OS-$$ARCH/$(BINARY_NAME) ./app; \
	cd $(BIN); tar czf $(BINARY_NAME)-$$OS-$$ARCH.tar.gz $(BINARY_NAME)-$$OS-$$ARCH;

build_windows_amd64: build_ui
	@OS=windows; ARCH=amd64; \
	echo Building $$OS/$$ARCH to $(BIN)/$(BINARY_NAME)-$$OS-$$ARCH; \
	CGO_ENABLED=0 GOOS=$$OS GOARCH=$$ARCH \
	go build $(OPTIONS) -o=$(BIN)/$(BINARY_NAME)-$$OS-$$ARCH/$(BINARY_NAME) ./app; \
	cd $(BIN); mv $(BINARY_NAME)-$$OS-$$ARCH/$(BINARY_NAME) $(BINARY_NAME)-$$OS-$$ARCH/$(BINARY_NAME).exe; zip -r $(BINARY_NAME)-$$OS-$$ARCH.zip $(BINARY_NAME)-$$OS-$$ARCH; 

build_all: test clean build_ui build_linux_amd64 build_linux_arm64 build_linux_arm_6 build_linux_arm_7 build_darwin_amd64 build_darwin_arm64 build_windows_amd64
