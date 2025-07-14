TAG=latest
NAME=chain-as-a-service
run:
	docker run --rm $(NAME):$(TAG)
build:
	docker build -t $(NAME):$(TAG) .
debug:
	docker inspect $(NAME):$(TAG) --format='{{.Config.Cmd}}'