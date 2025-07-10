import { text, intro, outro } from "@clack/prompts";
import { mkdir } from "fs/promises";
import { writeFile } from "fs/promises";
import { dirname } from "path";

async function main() {
    intro("Prepare ERC20 Deployment Config");

    const idFile = await text({
        message: "Path to identity file:",
        placeholder: "id.json",
        defaultValue: "id.json"
    }) || "id.json";

    const contractPath = await text({
        message: "Contract path (e.g. /contracts/erc20/MyToken.sol:MyToken):",
        placeholder: "/contracts/erc20/MyToken.sol:MyToken",
        defaultValue: "/contracts/erc20/MyToken.sol:MyToken"
    }) || "/contracts/erc20/MyToken.sol:MyToken";

    const name = await text({
        message: "Token name:",
        placeholder: "MyToken",
        defaultValue: "MyToken"
    }) || "MyToken";
    const symbol = await text({
        message: "Token symbol:",
        placeholder: "MTK",
        defaultValue: "MTK"
    }) || "MTK";
    const supplyStr = await text({
        message: "Initial supply:",
        placeholder: "10000",
        defaultValue: "10000",
        validate: (v: string) => isNaN(Number(v)) ? "Enter a number" : undefined
    }) || "10000";
    const supply = Number(supplyStr);

    const outFile = await text({
        message: "Output config filename:",
        placeholder: "./scripts/deploy_config.json",
        defaultValue: "./scripts/deploy_config.json"
    }) || "./scripts/deploy_config.json";

    if (typeof outFile !== "string") {
        outro("Invalid output filename");
        return;
    }
    await mkdir(dirname(outFile), { recursive: true });
    await writeFile(outFile, JSON.stringify({
        idFile, contractPath, name, symbol, supply
    }, null, 2));

    outro(`Config written to ${outFile}`);
}

main().catch(e => {
    console.error(e);
    process.exit(1);
}); 