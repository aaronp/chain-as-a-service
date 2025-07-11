import { writeFile } from "fs/promises";

async function main() {
    // Read all stdin
    const chunks: Buffer[] = [];
    for await (const chunk of process.stdin) {
        chunks.push(Buffer.from(chunk));
    }
    const output = Buffer.concat(chunks).toString("utf8");
    // console.log(output);

    // Extract deployer, contract address, and tx hash using regex
    const deployer = output.match(/Deployer:\s*(0x[0-9a-fA-F]{40})/i)?.[1] || null;
    const contract = output.match(/Deployed to:\s*(0x[0-9a-fA-F]{40})/i)?.[1] || null;
    const tx = output.match(/Transaction hash:\s*(0x[0-9a-fA-F]{64})/i)?.[1] || null;

    const result = {
        timestamp: new Date().toISOString(),
        deployer,
        contract,
        tx,
        raw: output
    };

    const outPath = `./state/deployment.json`;
    await writeFile(outPath, JSON.stringify(result, null, 2));
    console.log(`Deployment info written to ${outPath}`);
}

main().catch(e => {
    console.error(e);
    process.exit(1);
}); 