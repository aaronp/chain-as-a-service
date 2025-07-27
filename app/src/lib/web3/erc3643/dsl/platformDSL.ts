import { PrivateAccount } from '@/ui/wallet/accounts';
import { deployTrexSuite, SetupAccounts } from '@/lib/web3/erc3643/deploy';
import { TrexSuite } from '../erc3643';
import TREXFactory from '@/contracts/erc3643/contracts/factory/TREXFactory.sol/TREXFactory.json';
import { ethers } from 'ethers';
import { getSigner } from '../erc3643';


type TokenArgs = {
    name: string,
    symbol: string,
    decimals: string,
}


export const platformDSL = (deployer: PrivateAccount) => {

    /**
     * @param chainId the chain to deploy to 
     * @param accounts the roles used to deploy the platform
     * @returns the deployed platform
     */
    const deploySuite = async (chainId: string, accounts: SetupAccounts) => deployTrexSuite(chainId, deployer, accounts)

    const deployToken = async (chainId: string, trex: TrexSuite, tokenArgs: TokenArgs & {
        owner: string,
        salt: string,
        irAgents?: string[],
        tokenAgents?: string[],
        complianceModules?: string[],
        complianceSettings?: any[],
        claimTopics?: string[],
        issuers?: string[],
        issuerClaims?: any[]
    }) => {
        // Get the TREXFactory contract
        const trexFactory = new ethers.Contract(
            trex.factories.trexFactory.address,
            TREXFactory.abi,
            await getSigner(deployer, chainId)
        );

        // Prepare the token deployment parameters
        const tokenDeploymentArgs = {
            owner: tokenArgs.owner,
            name: tokenArgs.name,
            symbol: tokenArgs.symbol,
            decimals: parseInt(tokenArgs.decimals),
            irs: ethers.ZeroAddress, // Will be deployed automatically
            ONCHAINID: ethers.ZeroAddress, // Will be deployed automatically
            irAgents: tokenArgs.irAgents || [],
            tokenAgents: tokenArgs.tokenAgents || [],
            complianceModules: tokenArgs.complianceModules || [],
            complianceSettings: tokenArgs.complianceSettings || [],
        };

        const claimDeploymentArgs = {
            claimTopics: tokenArgs.claimTopics || [],
            issuers: tokenArgs.issuers || [],
            issuerClaims: tokenArgs.issuerClaims || [],
        };

        console.log('Deploying token suite using TREXFactory:', tokenArgs.name);
        console.log('Token deployment args:', tokenDeploymentArgs);
        console.log('Claim deployment args:', claimDeploymentArgs);

        // Deploy the complete token suite using TREXFactory
        const tx = await trexFactory.deployTREXSuite(
            tokenArgs.salt,
            tokenDeploymentArgs,
            claimDeploymentArgs
        );

        console.log('TREXFactory deployment transaction:', tx.hash);
        const receipt = await tx.wait();

        console.log('TREXFactory deployment receipt w/ logs:', receipt.logs.length);

        // Parse events from the transaction receipt
        const events = receipt.logs.map((log: any) => {
            try {
                // Try to parse the log using the factory ABI
                const parsedLog = trexFactory.interface.parseLog(log);
                if (parsedLog) {
                    return {
                        eventName: parsedLog.name,
                        args: parsedLog.args,
                        address: log.address,
                        topics: log.topics,
                        data: log.data
                    };
                } else {
                    return {
                        eventName: 'Unknown',
                        args: {},
                        address: log.address,
                        topics: log.topics,
                        data: log.data,
                        parseError: 'Failed to parse log'
                    };
                }
            } catch (error: any) {
                // If parsing fails, return raw log data
                return {
                    eventName: 'Unknown',
                    args: {},
                    address: log.address,
                    topics: log.topics,
                    data: log.data,
                    parseError: error?.message || 'Unknown error'
                };
            }
        });

        console.log('Deployment events:', events.length);

        // Extract specific addresses from events if available
        let deployedAddresses: any = {};
        events.forEach((event: any) => {
            console.log('event:', event.eventName);
            if (event.eventName === 'TREXSuiteDeployed') {
                console.log('TREXSuiteDeployed event:', event.args);
                deployedAddresses.tokenAddress = event.args[0];
                deployedAddresses.identityRegistryAddress = event.args[3]; // Identity registry is the 4th parameter
            } else if (event.eventName === 'IdentityRegistryDeployed') {
                deployedAddresses.identityRegistryAddress = event.args?.identityRegistryAddress;
            } else if (event.eventName === 'ComplianceDeployed') {
                deployedAddresses.complianceAddress = event.args?.complianceAddress;
            }
            // Add more event parsing as needed
        });

        return {
            transactionHash: tx.hash,
            tokenName: tokenArgs.name,
            tokenSymbol: tokenArgs.symbol,
            salt: tokenArgs.salt,
            events: events,
            deployedAddresses: deployedAddresses,
            receipt: receipt
        };
    }

    return {
        deploySuite,
        deployToken
    }
}