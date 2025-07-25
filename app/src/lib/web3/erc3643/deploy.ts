import { BytesLike, Contract, Interface, InterfaceAbi, id, ethers, keccak256, AbiCoder, ContractFactory } from 'ethers';
import { newAccount, PrivateAccount } from "@/ui/wallet/accounts";
import OnchainID from '@onchain-id/solidity';
import { Accounts, Deployed, encodeAddress, getSigner, TrexSuite } from './erc3643';

import ClaimTopicsRegistry from '@/contracts/erc3643/contracts/registry/implementation/ClaimTopicsRegistry.sol/ClaimTopicsRegistry.json';
import TrustedIssuersRegistry from '@/contracts/erc3643/contracts/registry/implementation/TrustedIssuersRegistry.sol/TrustedIssuersRegistry.json';
import IdentityRegistryStorage from '@/contracts/erc3643/contracts/registry/implementation/IdentityRegistryStorage.sol/IdentityRegistryStorage.json';
import IdentityRegistry from '@/contracts/erc3643/contracts/registry/implementation/IdentityRegistry.sol/IdentityRegistry.json';
import ModularCompliance from '@/contracts/erc3643/contracts/compliance/modular/ModularCompliance.sol/ModularCompliance.json';
import Token from '@/contracts/erc3643/contracts/token/Token.sol/Token.json';
import TREXImplementationAuthority from '@/contracts/erc3643/contracts/proxy/authority/TREXImplementationAuthority.sol/TREXImplementationAuthority.json';
import TREXFactory from '@/contracts/erc3643/contracts/factory/TREXFactory.sol/TREXFactory.json';
import ClaimTopicsRegistryProxy from '@/contracts/erc3643/contracts/proxy/ClaimTopicsRegistryProxy.sol/ClaimTopicsRegistryProxy.json';
import TrustedIssuersRegistryProxy from '@/contracts/erc3643/contracts/proxy/TrustedIssuersRegistryProxy.sol/TrustedIssuersRegistryProxy.json';
import IdentityRegistryStorageProxy from '@/contracts/erc3643/contracts/proxy/IdentityRegistryStorageProxy.sol/IdentityRegistryStorageProxy.json';
import DefaultCompliance from '@/contracts/erc3643/contracts/compliance/legacy/DefaultCompliance.sol/DefaultCompliance.json';
import IdentityRegistryProxy from '@/contracts/erc3643/contracts/proxy/IdentityRegistryProxy.sol/IdentityRegistryProxy.json';
import TokenProxy from '@/contracts/erc3643/contracts/proxy/TokenProxy.sol/TokenProxy.json';
import AgentManager from '@/contracts/erc3643/contracts/roles/permissioning/agent/AgentManager.sol/AgentManager.json';
import { client } from '@/api/client';
import { bytecodeToBase64 } from '@/lib/utils';
import { KeyPurpose, KeyType } from './keys';
import { platformDSL } from './dsl/platformDSL';
import { userDSL } from './dsl/userDSL';
import { tokenAgentDSL } from './dsl/tokenAgentDSL';
import { createKYCClaim } from './claims';
import { claimsSigningKeyDSL } from './dsl/claimsSigningKeyDSL';



const deployContract = async (chainId: string, deployer: PrivateAccount, contractName: string, abi: Interface | InterfaceAbi, bytecode: BytesLike, ...args: any[]): Promise<Deployed> => {
  const signer = await getSigner(deployer, chainId);


  // // prove we can read/write the abi as json
  // const abiJson = JSON.parse(JSON.stringify(abi));
  // client().registerContract({
  //   chainId,
  //   issuerAddress: deployer.address,
  //   contractAddress: '',
  //   contractType: contractName,
  //   parameters: abiJson,
  // })
  const found = await client().listContracts({ type: contractName, chain: chainId })
  if (found.length > 0) {
    console.log(`🔍 found ${contractName} created on ${new Date(found[0].created).toLocaleString()} 🙌`);
    return {
      address: found[0].contractAddress,
      getContract: async (account: PrivateAccount) => new ethers.Contract(found[0].contractAddress, found[0].abi, await getSigner(account, chainId))
    };
  }
  console.log(`🚀 Deploying ${contractName}...`);


  const contract = new ethers.ContractFactory(abi, bytecode, signer);
  const deployment = await contract.deploy(...args);
  await deployment.waitForDeployment();

  const address = await deployment.getAddress();

  await client().registerContract({
    chainId,
    issuerAddress: deployer.address,
    contractAddress: address,
    contractType: contractName,
    abi: JSON.stringify(abi),
    bytecode: bytecodeToBase64(bytecode),
    parameters: args,
  }).then(result => {
    console.log('✍🏻 registered contract', result.contractAddress);
    return result;
  })


  return {
    address,
    getContract: async (account: PrivateAccount) => new ethers.Contract(address, abi, await getSigner(account, chainId)),
  };
}

export type SetupAccounts = {
  // claimIssuer: PrivateAccount,
  tokenIssuerAddress: string,
  tokenAgentAddress: string,
  claimIssuerAddress: string,
}

export async function deployTrexSuite(chainId: string, deployer: PrivateAccount, accounts: SetupAccounts): Promise<TrexSuite> {

  const { tokenIssuerAddress, tokenAgentAddress, claimIssuerAddress } = accounts;


  // check if the contract has been deployed so we know whether we need to initialize it
  const isTRexAlreadyDeployed = async () => {
    const contracts = await client().listContracts({
      chain: chainId,
      type: 'TREXImplementationAuthority',
    });
    return contracts.length > 0;
  }

  const requiresContractInit = !(await isTRexAlreadyDeployed());
  console.log('requiresContractInit', requiresContractInit);


  // ============================================================================================================================
  // Deploy implementations
  // ============================================================================================================================  

  const claimTopicsRegistryImplementation = await deployContract(chainId, deployer, 'ClaimTopicsRegistry', ClaimTopicsRegistry.abi, ClaimTopicsRegistry.bytecode);
  const trustedIssuersRegistryImplementation = await deployContract(chainId, deployer, 'TrustedIssuersRegistry', TrustedIssuersRegistry.abi, TrustedIssuersRegistry.bytecode);
  const identityRegistryStorageImplementation = await deployContract(chainId, deployer, 'IdentityRegistryStorage', IdentityRegistryStorage.abi, IdentityRegistryStorage.bytecode);
  const identityRegistryImplementation = await deployContract(chainId, deployer, 'IdentityRegistry', IdentityRegistry.abi, IdentityRegistry.bytecode);
  const modularComplianceImplementation = await deployContract(chainId, deployer, 'ModularCompliance', ModularCompliance.abi, ModularCompliance.bytecode);
  const tokenImplementation = await deployContract(chainId, deployer, 'Token', Token.abi, Token.bytecode);
  const identityImplementation = await deployContract(chainId, deployer, 'OnchainID', OnchainID.contracts.Identity.abi, OnchainID.contracts.Identity.bytecode, deployer.address, true);
  const identityImplementationAuthority = await deployContract(chainId, deployer, 'ImplementationAuthority', OnchainID.contracts.ImplementationAuthority.abi, OnchainID.contracts.ImplementationAuthority.bytecode, identityImplementation.address);
  const identityFactory = await deployContract(chainId, deployer, 'Factory', OnchainID.contracts.Factory.abi, OnchainID.contracts.Factory.bytecode, identityImplementationAuthority.address);
  const trexImplementationAuthority = await deployContract(
    chainId,
    deployer,
    'TREXImplementationAuthority',
    TREXImplementationAuthority.abi,
    TREXImplementationAuthority.bytecode,
    true, ethers.ZeroAddress, ethers.ZeroAddress
  );

  const versionStruct = {
    major: 4,
    minor: 0,
    patch: 0,
  };
  const contractsStruct = {
    tokenImplementation: tokenImplementation.address,
    ctrImplementation: claimTopicsRegistryImplementation.address,
    irImplementation: identityRegistryImplementation.address,
    irsImplementation: identityRegistryStorageImplementation.address,
    tirImplementation: trustedIssuersRegistryImplementation.address,
    mcImplementation: modularComplianceImplementation.address,
  };



  requiresContractInit && await (await trexImplementationAuthority.getContract(deployer)).addAndUseTREXVersion(versionStruct, contractsStruct);


  const trexFactory = await deployContract(chainId, deployer, 'TREXFactory', TREXFactory.abi, TREXFactory.bytecode, trexImplementationAuthority.address, identityFactory.address);
  requiresContractInit && await (await identityFactory.getContract(deployer)).addTokenFactory(trexFactory.address);

  const claimTopicsRegistry = await deployContract(chainId, deployer, 'ClaimTopicsRegistryProxy', ClaimTopicsRegistryProxy.abi, ClaimTopicsRegistryProxy.bytecode, trexImplementationAuthority.address);
  const trustedIssuersRegistry = await deployContract(chainId, deployer, 'TrustedIssuersRegistryProxy', TrustedIssuersRegistryProxy.abi, TrustedIssuersRegistryProxy.bytecode, trexImplementationAuthority.address);
  const identityRegistryStorage = await deployContract(chainId, deployer, 'IdentityRegistryStorageProxy', IdentityRegistryStorageProxy.abi, IdentityRegistryStorageProxy.bytecode, trexImplementationAuthority.address);
  const defaultCompliance = await deployContract(chainId, deployer, 'DefaultCompliance', DefaultCompliance.abi, DefaultCompliance.bytecode);
  const identityRegistry = await deployContract(chainId, deployer, 'IdentityRegistryProxy', IdentityRegistryProxy.abi, IdentityRegistryProxy.bytecode, trexImplementationAuthority.address, trustedIssuersRegistry.address, claimTopicsRegistry.address, identityRegistryStorage.address);
  const tokenOID = await deployContract(chainId, deployer, 'TokenOID', OnchainID.contracts.IdentityProxy.abi, OnchainID.contracts.IdentityProxy.bytecode, identityImplementationAuthority.address, tokenIssuerAddress);



  // ============================================================================================================================
  // Deploy A Token
  // ============================================================================================================================  


  const tokenName = 'TREXDINO';
  const tokenSymbol = 'TREX';
  const tokenDecimals = '0' //BigNumber.from('0');

  const isTokenAlreadyDeployed = async () => {
    const contracts = await client().listContracts({
      chain: chainId,
      type: 'TokenProxy',
    });
    return contracts.length > 0;
  }

  const requiresTokenInit = !(await isTokenAlreadyDeployed());
  console.log('requiresTokenInit', requiresTokenInit);


  const token = await
    deployContract(
      chainId,
      deployer,
      'TokenProxy',
      TokenProxy.abi,
      TokenProxy.bytecode,

      trexImplementationAuthority.address,
      identityRegistry.address,
      defaultCompliance.address,
      tokenName,
      tokenSymbol,
      tokenDecimals,
      tokenOID.address,
    );


  /**
   * The AgentManager contract is a permissioning and role management contract for the ERC3643 token suite. Its main responsibilities are:
Role Assignment & Management: It allows the owner to assign and remove various agent roles to addresses, such as:
Agent Admin
Compliance Agent
Freezer
Recovery Agent
Supply Modifier
Transfer Manager
WhiteList Manager
Role Checks: It provides functions to check if a given address has a specific agent role (e.g., isAgentAdmin(address), isComplianceAgent(address), etc.).
Batch Operations: It exposes batch functions for privileged operations on the token, such as:
Batch minting and burning
Batch forced transfers
Batch freezing/unfreezing of tokens or addresses
Batch identity registration and updates
Token Control: It can call privileged functions on the token contract, such as pausing/unpausing, minting, burning, forced transfers, and recovery operations, typically requiring an on-chain identity for authorization.
Ownership: The contract has an owner (usually the deployer or a governance address) who can transfer or renounce ownership.
In summary:
The AgentManager acts as a central authority for managing privileged roles and executing administrative or compliance-related actions on the ERC3643 token and its associated contracts. It is designed to support regulated token environments where fine-grained control and auditability of agent actions are required.
   */
  const agentManager = await deployContract(chainId, deployer, 'AgentManager', AgentManager.abi, AgentManager.bytecode, token.address);

  // Use the implementation ABI at the proxy address to call bindIdentityRegistry
  const identityRegistryStorageAtProxy = new ethers.Contract(
    identityRegistryStorage.address, // proxy address
    IdentityRegistryStorage.abi,     // implementation ABI
    await getSigner(deployer, chainId)
  );

  requiresContractInit && await identityRegistryStorageAtProxy.bindIdentityRegistry(identityRegistry.address);

  // Use the implementation ABI at the proxy address to call addAgent
  const tokenAtProxy = async () => new ethers.Contract(
    token.address, // proxy address
    Token.abi,     // implementation ABI
    await getSigner(deployer, chainId)
  );

  requiresTokenInit && await (await tokenAtProxy()).addAgent(tokenAgentAddress);

  const claimTopics = [id('CLAIM_TOPIC')];
  const claimTopicsRegistryAtProxy = new ethers.Contract(
    claimTopicsRegistry.address, // proxy address
    ClaimTopicsRegistry.abi,     // implementation ABI
    await getSigner(deployer, chainId)
  );

  requiresContractInit && await claimTopicsRegistryAtProxy.addClaimTopic(claimTopics[0]);

  const claimIssuerContract = await deployContract(chainId, deployer, 'ClaimIssuer', OnchainID.contracts.ClaimIssuer.abi, OnchainID.contracts.ClaimIssuer.bytecode, claimIssuerAddress);


  // requiresContractInit && await (await claimIssuerContract.getContract(deployer)).addKey(encodeAddress(claimIssuerSigningKeyAddress), 3, 1);


  const trustedIssuersRegistryAtProxy = new ethers.Contract(
    trustedIssuersRegistry.address, // proxy address
    TrustedIssuersRegistry.abi,     // implementation ABI
    await getSigner(deployer, chainId)
  );
  requiresContractInit && await trustedIssuersRegistryAtProxy.addTrustedIssuer(claimIssuerContract.address, claimTopics);


  // Human/operator account for privileged actions - being added to manage identities, perform compliance operations, etc.
  const identityRegistryAtProxy = async () => {
    return new ethers.Contract(
      identityRegistry.address, // proxy address
      IdentityRegistry.abi,     // implementation ABI
      await getSigner(deployer, chainId)
    );
  }
  requiresTokenInit && await (await identityRegistryAtProxy()).addAgent(tokenAgentAddress);
  requiresTokenInit && await (await identityRegistryAtProxy()).addAgent(token.address);

  return {
    suite: {
      claimIssuerContract,
      claimTopicsRegistry,
      trustedIssuersRegistry,
      identityRegistryStorage,
      defaultCompliance,
      identityRegistry,
      tokenOID,
      token,
      agentManager,
    },
    authorities: {
      trexImplementationAuthority,
      identityImplementationAuthority,
    },
    factories: {
      trexFactory,
      identityFactory,
    },
    implementations: {
      identityImplementation,
      claimTopicsRegistryImplementation,
      trustedIssuersRegistryImplementation,
      identityRegistryStorageImplementation,
      identityRegistryImplementation,
      modularComplianceImplementation,
      tokenImplementation,
    },
  };
}




export type Persona = {
  personalAccount: PrivateAccount;
  actionAccount: PrivateAccount;
  managementAccount: PrivateAccount;
}
export const newPersona = async (name: string): Promise<Persona> => {
  const personalAccount = (await newAccount(`${name} Personal`)).private;
  const actionAccount = (await newAccount(`${name} Action`)).private;
  const managementAccount = (await newAccount(`${name} Management`)).private;
  return { personalAccount, actionAccount, managementAccount };
}


export const getIdentityContract = async (identityAddress: string, chainId: string, account: PrivateAccount) => {
  return new ethers.Contract(identityAddress, OnchainID.contracts.Identity.abi, await getSigner(account, chainId))
}

export async function deployIdentityProxy(chainId: string, trex: TrexSuite, deployer: PrivateAccount, userAddress: string): Promise<Deployed> {
  const implementationAuthorityContractAddress = trex.authorities.identityImplementationAuthority.address

  const identity = await deployContract(chainId, deployer, `IdentityProxy-${userAddress}`, OnchainID.contracts.IdentityProxy.abi, OnchainID.contracts.IdentityProxy.bytecode,
    implementationAuthorityContractAddress,
    userAddress,
  );

  return {
    address: identity.address,
    getContract: async (account: PrivateAccount) => getIdentityContract(identity.address, chainId, account)
  }
}

const textAsHex = (text: string) => ethers.hexlify(ethers.toUtf8Bytes(text))


export type UserToOnboard = {
  addresses: {
    personalAccount: string
    actionAccount: string,
    managementAccount: string
  }
  userClaim: string,
  countryCode: number
}

async function deployAccountFlow(chainId: string, admin: Accounts, trex: TrexSuite, userPersona: Persona, user: UserToOnboard) {

  /**
   * 1. Deployer registeres a new OnChainID identity for the user
   */
  // TODO - check if the token agent can do this
  // const userIdentity = await platformDSL(admin.tokenAgent).createUserIdentity(chainId, trex, user.addresses.personalAccount);
  const userIdentity = await platformDSL(admin.deployer).createUserIdentity(chainId, trex, user.addresses.personalAccount);



  /**
   * 2. The user adds their action account to the identity
   */
  // person step - add their action account
  // const aliceAddKeyResult = await (await userIdentity.getContract(newPersona.personalAccount)).addKey(encodeAddress(newPersona.actionAccount.address), KeyPurpose.execution, KeyType.ECDSA);
  const aliceAddKeyResult = await userDSL(userPersona.personalAccount).registerActionAccount(chainId, userIdentity.address, user.addresses.actionAccount);


  /**
   * 3 register this identity 
   */
  await tokenAgentDSL(admin.tokenAgent).registerUserIdentity(chainId, trex.suite.identityRegistry.address, {
    accountAddress: user.addresses.personalAccount,
    identityAddress: userIdentity.address,
    countryCode: user.countryCode
  });


  /**
   * 4. The user creates a KYC claim
   */
  const claimForAlice = createKYCClaim(userIdentity.address, trex.suite.claimIssuerContract.address, user.userClaim);

  /**
   * 4.1 : the claims issuer (w/ their signing key) signs the claim
   */
  claimForAlice.signature = await claimsSigningKeyDSL(admin.claimIssuerSigningKey).signKYCClaim(chainId, userIdentity.address, claimForAlice.data);

  /**
   * 4.2 : the user adds the signed claim to their identity
   */
  const aliceAddClaimResult = await userDSL(userPersona.personalAccount).addSignedClaim(chainId, userIdentity.address, claimForAlice);

  // const aliceAddClaimResult = await (await userIdentity.getContract(userPersona.personalAccount))
  //   .addClaim(claimForAlice.topic, claimForAlice.scheme, claimForAlice.issuer, claimForAlice.signature, claimForAlice.data, '');


  return {
    identityContract: userIdentity.address,
    claimsHash: aliceAddClaimResult.hash,
    actionHash: aliceAddKeyResult.hash
  }
}


export const tokenContract = async (chainId: string, tokenAddress: string, account: PrivateAccount) => {
  return new ethers.Contract(
    tokenAddress, // proxy address
    Token.abi,                // implementation ABI
    await getSigner(account, chainId)
  );
}

export async function setupAccounts(chainId: string, admin: Accounts, newPersona: Persona, trex: TrexSuite) {

  const alice = await deployAccountFlow(chainId, admin, trex, newPersona, {
    addresses: {
      personalAccount: newPersona.personalAccount.address,
      actionAccount: newPersona.actionAccount.address,
      managementAccount: newPersona.managementAccount.address
    },
    userClaim: 'Some claim public data.',
    countryCode: 42
  });

  // // Mint tokens for Alice using the implementation ABI at the proxy address
  const tokenAtProxy = new ethers.Contract(
    trex.suite.token.address, // proxy address
    Token.abi,                // implementation ABI
    await getSigner(admin.tokenAgent, chainId)
  );


  const balanceResultBefore = await (await tokenContract(chainId, trex.suite.token.address, newPersona.personalAccount)).balanceOf(newPersona.personalAccount.address);
  console.log('before mint, balanceResult', balanceResultBefore);

  const mintResult = await tokenAtProxy.mint(newPersona.personalAccount.address, 1000);
  console.log('mintResult', mintResult.hash);
  // await token.connect(tokenAgent).mint(bobWallet.address, 500);

  const balanceResult = await tokenAtProxy.balanceOf(newPersona.personalAccount.address);
  console.log('after mint, balanceResult', balanceResult);

  // await (await trex.suite.agentManager.getContract(admin.deployer)).addAgentAdmin(admin.tokenAdmin.address);
  // await (await trex.suite.token.getContract(admin.deployer)).addAgent(trex.suite.agentManager.address);
  // await (await trex.suite.identityRegistry.getContract(admin.deployer)).addAgent(trex.suite.agentManager.address);

  // const unpauseResult = await (await trex.suite.token.getContract(admin.tokenAgent)).unpause();
  // console.log('unpauseResult', unpauseResult);
  // console.log('unpauseResult', unpauseResult.hash);

  return {
    identities: {
      aliceIdentity: alice.identityContract,
    }
  }

}
