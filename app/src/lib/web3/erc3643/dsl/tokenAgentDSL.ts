import { PrivateAccount } from '@/ui/wallet/accounts';
import { ethers } from 'ethers';
import IdentityRegistry from '@/contracts/erc3643/contracts/registry/implementation/IdentityRegistry.sol/IdentityRegistry.json';
import { getSigner, TrexSuite } from '../erc3643';
import { deployIdentityProxy, tokenContract } from '../deploy';

type User = {
    accountAddress: string,
    identityAddress: string,
    countryCode: number
}
export const tokenAgentDSL = (tokenAgent: PrivateAccount) => {


    const registerUserIdentity = async (chainId: string, identityRegistryAddress: string, user: User) => {

        const identityRegistryAtProxy = async () => {
            return new ethers.Contract(
                identityRegistryAddress, // proxy address
                IdentityRegistry.abi,     // implementation ABI
                await getSigner(tokenAgent, chainId) // <--- NOTE: this has to be the tokenAgent account (not the deployer) to register identities
            );
        }
        // these are tuples of wallet addresses, on-chain identity addresses, and country codes
        await (await identityRegistryAtProxy()).batchRegisterIdentity([user.accountAddress], [user.identityAddress], [user.countryCode]);
    }

    const createUserIdentity = async (chainId: string, trex: TrexSuite, userAddress: string) => {
        return await deployIdentityProxy(chainId, trex.authorities.identityImplementationAuthority.address, tokenAgent, userAddress);
    }

    const mintTokens = async (chainId: string, tokenAddress: string, userAddress: string, amount: number) => {
        const tokenAtProxy = await tokenContract(chainId, tokenAddress, tokenAgent);
        return await tokenAtProxy.mint(userAddress, amount);
    }

    const balanceOf = async (chainId: string, tokenAddress: string, userAddress: string) => {
        const tokenAtProxy = await tokenContract(chainId, tokenAddress, tokenAgent);
        return await tokenAtProxy.balanceOf(userAddress);
    }

    const metadata = async (chainId: string, tokenAddress: string) => {
        const tokenAtProxy = await tokenContract(chainId, tokenAddress, tokenAgent);
        const name = await tokenAtProxy.name();
        const symbol = await tokenAtProxy.symbol();
        const decimals = await tokenAtProxy.decimals();
        return { name, symbol, decimals, tokenAddress };
    }


    return {
        registerUserIdentity,
        createUserIdentity,
        mintTokens,
        balanceOf,
        metadata
    }
}