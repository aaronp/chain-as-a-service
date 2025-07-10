import { execa } from "execa";

await execa("docker", ["rm", "-f", "anvil_txcase"]);
