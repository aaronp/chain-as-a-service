TAG=latest
NAME=chain-as-a-service
run:
	docker run --rm -it -p 3000:3000 $(NAME):$(TAG)
stop:
	docker stop $(NAME):$(TAG)
remove:
	docker rm $(NAME):$(TAG)
logs:
	docker logs -f $(NAME):$(TAG)
build:
	docker build -t $(NAME):$(TAG) .
debug:
	docker inspect $(NAME):$(TAG) --format='{{.Config.Cmd}}'