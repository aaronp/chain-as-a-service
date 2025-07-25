.PHONY: build run stop remove dev

NAME=just-bun
TAG=latest

build:
	docker build -t $(NAME):$(TAG) .

run:
	docker run --name $(NAME) --rm -it -p 3000:3000 $(NAME):$(TAG)
stop:
	ps aux | grep "bun.*index" | grep -v grep | awk '{print $$2}' | xargs -r kill -9
running:
	ps aux | grep "bun.*index" | grep -v grep

remove:
	docker stop $(NAME) || true
	docker rm $(NAME) || true

tailwind:
	bunx tailwindcss -i ./src/input.css -o ./dist/output.css --watch

dev: tailwind
	bun dev


test:
	NODE_ENV=development bun test tests/deployERC3643.test.ts

test-erc20:
	NODE_ENV=development bun test tests/deployERC20.test.ts

test-all:
	NODE_ENV=development bun test
