start:
	bun run src/start.ts

stop:
	bun run src/stop.ts
id:
	bun run src/createIdentity.ts
accounts:
	bun run src/accounts.ts
deploy:
	bun run src/createDeploy.ts
deployExec:
	docker exec -it anvil_bootstrap /bin/sh /scripts/deploy.sh /scripts/deploy_config.json | tee /dev/tty | bun run src/parseDeploy.ts
shell:
	docker exec -it anvil_bootstrap /bin/sh 
tx:
	bun run src/tx.ts