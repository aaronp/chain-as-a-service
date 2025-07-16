import path from "path";
import fs from "fs";

const erc20dir = path.resolve(process.cwd(), "contracts/erc20");
const abiPath = path.resolve(erc20dir, "out/MyToken.sol/MyToken.json"); // TODO: make this dynamic


export const erc20Template = async () => {
    const abiJson = JSON.parse(fs.readFileSync(abiPath, "utf-8"));
    const abi = abiJson.abi;
    const bytecode = abiJson.bytecode.object;
    return { abi, bytecode };
}