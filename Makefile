PORT=4000
ENV=dev

## clean: cleans all binaries and runs go clean
clean:
	@echo "Cleaning..."
	@- rm -f dist/*
	@go clean
	@echo "Cleaned!"

## build: builds the binaty
build: clean
	@echo "Building..."
	@go build -o dist/web-logbook ./cmd/web
	@echo "Web-logbook built!"

## start: starts the web-logbook
start: build
	@echo "Starting the app..."
	@env ./dist/web-logbook -port=${PORT} -env="${ENV}"
