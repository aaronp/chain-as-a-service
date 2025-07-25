import { PrivateAccount } from '@/ui/wallet/accounts';
import { deployTrexSuite, SetupAccounts } from '@/lib/web3/erc3643/deploy';
import { TrexSuite } from '../erc3643';
import { tokenContract, deployContract } from '../deploy';
import TokenProxy from '@/contracts/erc3643/contracts/proxy/TokenProxy.sol/TokenProxy.json';
import AgentManager from '@/contracts/erc3643/contracts/roles/permissioning/agent/AgentManager.sol/AgentManager.json';
import OnchainID from '@onchain-id/solidity';


type TokenArgs = {
    name: string,
    symbol: string,
    decimals: number,
}


export const platformDSL = (deployer: PrivateAccount) => {

    /**
     * @param chainId the chain to deploy to 
     * @param accounts the roles used to deploy the platform
     * @returns the deployed platform
     */
    const deploySuite = async (chainId: string, accounts: SetupAccounts) => deployTrexSuite(chainId, deployer, accounts)


    const createToken = async (chainId: string, trex: TrexSuite,
        tokenIssuerAddress: string,
        tokenAgentAddress: string,
        tokenArgs: TokenArgs) => {
        // Deploy token-specific contracts (reusing existing infrastructure)

        // 1. Deploy token OID (token-specific identity)
        const tokenOID = await deployContract(
            chainId,
            deployer,
            `TokenOID-${tokenArgs.name}`,
            OnchainID.contracts.IdentityProxy.abi,
            OnchainID.contracts.IdentityProxy.bytecode,
            trex.authorities.identityImplementationAuthority.address,
            tokenIssuerAddress
        );

        // 2. Deploy token proxy (the actual token contract)
        const token = await deployContract(
            chainId,
            deployer,
            `TokenProxy-${tokenArgs.name}`,
            TokenProxy.abi,
            TokenProxy.bytecode,
            trex.authorities.trexImplementationAuthority.address,
            trex.suite.identityRegistry.address,
            trex.suite.defaultCompliance.address,
            tokenArgs.name,
            tokenArgs.symbol,
            tokenArgs.decimals,
            tokenOID.address,
        );

        // 3. Deploy agent manager for this token
        const agentManager = await deployContract(
            chainId,
            deployer,
            `AgentManager-${tokenArgs.name}`,
            AgentManager.abi,
            AgentManager.bytecode,
            token.address
        );

        // 4. Add token agent to the token
        const tokenAtProxy = await tokenContract(chainId, token.address, deployer);
        await tokenAtProxy.addAgent(tokenAgentAddress);

        return {
            token,
            tokenOID,
            agentManager,
            tokenAddress: token.address
        };
    }

    return {
        deploySuite,
        createToken
    }
}