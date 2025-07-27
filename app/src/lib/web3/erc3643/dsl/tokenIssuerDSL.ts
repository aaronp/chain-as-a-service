import { PrivateAccount } from '@/ui/wallet/accounts';
import { ethers } from 'ethers';
import IdentityRegistry from '@/contracts/erc3643/contracts/registry/implementation/IdentityRegistry.sol/IdentityRegistry.json';
import { getSigner, TrexSuite } from '../erc3643';
import { deployIdentityProxy, tokenContract } from '../deploy';

//https://github.com/TokenySolutions/T-REX/blob/main/contracts/token/Token.sol
import Token from '@/contracts/erc3643/contracts/token/Token.sol/Token.json';

export const tokenIssuerDSL = (tokenIssuer: PrivateAccount) => {

    const addAgent = async (chainId: string, tokenAddress: string, agentAddress: string) => {
        const token = new ethers.Contract(
            tokenAddress,
            Token.abi,
            await getSigner(tokenIssuer, chainId)
        );


        const tx = await token.addAgent(agentAddress);
        const receipt = await tx.wait();
        return receipt;
    }


    return {
        addAgent
    }
}