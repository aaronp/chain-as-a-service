import { execa } from "execa";

await execa("docker", ["rm", "-f", "evm-as-a-service"]);
