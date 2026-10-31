.PHONY: all run-backend run-frontend seed build-all test

all: run-all

seed:
	cd backend && go run ./cmd/seed

run-backend:
	cd backend && go run ./cmd/server

run-frontend:
	cd frontend && npm run dev

build-all:
	cd backend && go build -o server ./cmd/server
	cd frontend && npm run build

test:
	cd backend && go test -v ./tests
