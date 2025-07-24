import { TrexSuite, Deployed, getSigner } from './erc3643';
import { PrivateAccount } from '@/ui/wallet/accounts';
import { Contract, ethers } from 'ethers';

// Helper to get a contract instance with the issuer as signer
async function contractWith(account: PrivateAccount, deployed: Deployed): Promise<Contract> {
    return deployed.getContract(account);
}



export function issuer(trex: TrexSuite, issuer: PrivateAccount) {
    const token = trex.suite.token;
    const identityRegistry = trex.suite.identityRegistry;
    const claimTopicsRegistry = trex.suite.claimTopicsRegistry;
    const trustedIssuersRegistry = trex.suite.trustedIssuersRegistry;
    // AgentManager and others can be added as needed

    return {
        // Mint tokens to an address
        async mint(to: string, amount: ethers.BigNumberish) {
            const c = await contractWith(issuer, token);
            return c.mint(to, amount);
        },
        // Burn tokens from an address
        async burn(from: string, amount: ethers.BigNumberish) {
            const c = await contractWith(issuer, token);
            return c.burn(from, amount);
        },
        // Freeze or unfreeze an account
        async setAddressFrozen(user: string, freeze: boolean) {
            const c = await contractWith(issuer, token);
            return c.setAddressFrozen(user, freeze);
        },
        // Force transfer tokens between addresses
        async forceTransfer(from: string, to: string, amount: ethers.BigNumberish) {
            const c = await contractWith(issuer, token);
            return c.forcedTransfer(from, to, amount);
        },
        // Register a new investor identity
        async registerIdentity(user: string, identity: string, country: number) {
            const c = await contractWith(issuer, identityRegistry);
            return c.registerIdentity(user, identity, country);
        },
        // Update an investor's identity
        async updateIdentity(user: string, newIdentity: string) {
            const c = await contractWith(issuer, identityRegistry);
            return c.updateIdentity(user, newIdentity);
        },
        // Update an investor's country
        async updateCountry(user: string, country: number) {
            const c = await contractWith(issuer, identityRegistry);
            return c.updateCountry(user, country);
        },
        // Account recovery: update identity and/or reassign tokens
        async recoverAccount(lostWallet: string, newWallet: string, investorOnchainID: string) {
            const c = await contractWith(issuer, token);
            return c.recoveryAddress(lostWallet, newWallet, investorOnchainID);
        },
        // Add a claim topic
        async addClaimTopic(topic: ethers.BigNumberish) {
            const c = await contractWith(issuer, claimTopicsRegistry);
            return c.addClaimTopic(topic);
        },
        // Remove a claim topic
        async removeClaimTopic(topic: ethers.BigNumberish) {
            const c = await contractWith(issuer, claimTopicsRegistry);
            return c.removeClaimTopic(topic);
        },
        // Add a trusted issuer
        async addTrustedIssuer(issuerAddress: string, claimTopics: ethers.BigNumberish[]) {
            const c = await contractWith(issuer, trustedIssuersRegistry);
            return c.addTrustedIssuer(issuerAddress, claimTopics);
        },
        // Remove a trusted issuer
        async removeTrustedIssuer(issuerAddress: string) {
            const c = await contractWith(issuer, trustedIssuersRegistry);
            return c.removeTrustedIssuer(issuerAddress);
        },
        // Assign agent role (to another address)
        async addAgent(agent: string) {
            const c = await contractWith(issuer, token);
            return c.addAgent(agent);
        },
        // Revoke agent role
        async removeAgent(agent: string) {
            const c = await contractWith(issuer, token);
            return c.removeAgent(agent);
        },
        // Pause/unpause token (optional, for emergencies)
        async pause() {
            const c = await contractWith(issuer, token);
            return c.pause();
        },
        async unpause() {
            const c = await contractWith(issuer, token);
            return c.unpause();
        },
    };
}
