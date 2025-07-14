TAG=latest
run:
	docker run --rm evm-as-a-service:$(TAG)
build:
	docker build -t evm-as-a-service:$(TAG) .
debug:
	docker inspect evm-as-a-service:$(TAG) --format='{{.Config.Cmd}}'