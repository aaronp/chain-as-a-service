import { intro, outro, text, select } from "@clack/prompts";
import { mkdir, writeFile, readFile } from "fs/promises";
import { dirname } from "path";

async function main() {
    intro("Prepare Contract Call Config");

    // Load ABI
    const abiPath = "./src/contracts/erc20/MyToken.json";
    const abiJson = JSON.parse(await readFile(abiPath, "utf8"));
    const abi = abiJson.abi;

    // Load deployed contract address
    const deployInfo = JSON.parse(await readFile("./state/deployment.json", "utf8"));
    const contractAddress = deployInfo.contract;

    // Filter for externally callable (non-view, non-pure) functions
    const functions = abi.filter(
        (f: any) => f.type === "function" && f.stateMutability !== "view" && f.stateMutability !== "pure"
    );

    if (functions.length === 0) {
        outro("No externally callable functions found in ABI.");
        process.exit(1);
    }

    // Prompt user to select function
    const funcName = await select({
        message: "Select function to call:",
        options: functions.map((f: any) => ({ value: f.name, label: f.name }))
    });
    if (!funcName) {
        outro("No function selected.");
        process.exit(1);
    }
    const func = functions.find((f: any) => f.name === String(funcName));

    // Prompt for arguments
    const args: any = {};
    for (const input of func.inputs) {
        const { name } = input;
        let value: string | undefined;
        while (value === undefined) {
            const inputValue = await text({
                message: `Enter value for ${name} (${input.type}):`,
                validate: (v: string) => v.trim() === "" ? "Required" : undefined
            });
            if (inputValue === undefined) {
                outro("No value provided.");
                process.exit(1);
            }
            value = String(inputValue);
        }
        args[name as string] = value;
    }

    // Prepare output
    const out = {
        timestamp: new Date().toISOString(),
        contract: contractAddress,
        function: func.name,
        args
    };
    const ts = Date.now();
    const outPath = `./scripts/call-${ts}.json`;
    await mkdir(dirname(outPath), { recursive: true });
    await writeFile(outPath, JSON.stringify(out, null, 2));

    outro(`Call config written to ${outPath}`);
}

main().catch(e => {
    console.error(e);
    process.exit(1);
}); 