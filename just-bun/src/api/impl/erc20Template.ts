import MyToken from "contracts/erc20/out/MyToken.sol/MyToken.json";

// const erc20dir = path.resolve(process.cwd(), "contracts/erc20");
// const abiPath = path.resolve(erc20dir, "out/MyToken.sol/MyToken.json"); // TODO: make this dynamic


export const erc20Template = async () => {
    const abi = MyToken.abi;
    const bytecode = MyToken.bytecode.object;
    return { abi, bytecode };
}