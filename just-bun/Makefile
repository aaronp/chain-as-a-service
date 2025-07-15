.PHONY: build run stop remove dev

NAME=just-bun
TAG=latest

build:
	docker build -t $(NAME):$(TAG) .

run:
	docker run --name $(NAME) --rm -it -p 3000:3000 $(NAME):$(TAG)
stop:
	docker stop $(NAME)
	
remove:
	docker stop $(NAME) || true
	docker rm $(NAME) || true

dev:
	bun dev
