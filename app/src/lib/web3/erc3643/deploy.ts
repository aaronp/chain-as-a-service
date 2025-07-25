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

export async function deployTrexSuite(chainId: string, accounts: Accounts): Promise<TrexSuite> {

  const { deployer, tokenIssuer, claimIssuer, claimIssuerSigningKey, tokenAgent } = accounts;


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

  const claimTopicsRegistryImplementation = await deployContract(chainId, accounts.deployer, 'ClaimTopicsRegistry', ClaimTopicsRegistry.abi, ClaimTopicsRegistry.bytecode);
  const trustedIssuersRegistryImplementation = await deployContract(chainId, accounts.deployer, 'TrustedIssuersRegistry', TrustedIssuersRegistry.abi, TrustedIssuersRegistry.bytecode);
  const identityRegistryStorageImplementation = await deployContract(chainId, accounts.deployer, 'IdentityRegistryStorage', IdentityRegistryStorage.abi, IdentityRegistryStorage.bytecode);
  const identityRegistryImplementation = await deployContract(chainId, accounts.deployer, 'IdentityRegistry', IdentityRegistry.abi, IdentityRegistry.bytecode);
  const modularComplianceImplementation = await deployContract(chainId, accounts.deployer, 'ModularCompliance', ModularCompliance.abi, ModularCompliance.bytecode);
  const tokenImplementation = await deployContract(chainId, accounts.deployer, 'Token', Token.abi, Token.bytecode);
  const identityImplementation = await deployContract(chainId, accounts.deployer, 'OnchainID', OnchainID.contracts.Identity.abi, OnchainID.contracts.Identity.bytecode, deployer.address, true);
  const identityImplementationAuthority = await deployContract(chainId, accounts.deployer, 'ImplementationAuthority', OnchainID.contracts.ImplementationAuthority.abi, OnchainID.contracts.ImplementationAuthority.bytecode, identityImplementation.address);
  const identityFactory = await deployContract(chainId, accounts.deployer, 'Factory', OnchainID.contracts.Factory.abi, OnchainID.contracts.Factory.bytecode, identityImplementationAuthority.address);
  const trexImplementationAuthority = await deployContract(
    chainId,
    accounts.deployer,
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


  console.log('addAndUseTREXVersion', trexImplementationAuthority);
  await (await trexImplementationAuthority.getContract(deployer)).addAndUseTREXVersion(versionStruct, contractsStruct);


  const trexFactory = await deployContract(chainId, accounts.deployer, 'TREXFactory', TREXFactory.abi, TREXFactory.bytecode, trexImplementationAuthority.address, identityFactory.address);
  await (await identityFactory.getContract(deployer)).addTokenFactory(trexFactory.address);

  const claimTopicsRegistry = await deployContract(chainId, accounts.deployer, 'ClaimTopicsRegistryProxy', ClaimTopicsRegistryProxy.abi, ClaimTopicsRegistryProxy.bytecode, trexImplementationAuthority.address);
  const trustedIssuersRegistry = await deployContract(chainId, accounts.deployer, 'TrustedIssuersRegistryProxy', TrustedIssuersRegistryProxy.abi, TrustedIssuersRegistryProxy.bytecode, trexImplementationAuthority.address);
  const identityRegistryStorage = await deployContract(chainId, accounts.deployer, 'IdentityRegistryStorageProxy', IdentityRegistryStorageProxy.abi, IdentityRegistryStorageProxy.bytecode, trexImplementationAuthority.address);
  const defaultCompliance = await deployContract(chainId, accounts.deployer, 'DefaultCompliance', DefaultCompliance.abi, DefaultCompliance.bytecode);
  const identityRegistry = await deployContract(chainId, accounts.deployer, 'IdentityRegistryProxy', IdentityRegistryProxy.abi, IdentityRegistryProxy.bytecode, trexImplementationAuthority.address, trustedIssuersRegistry.address, claimTopicsRegistry.address, identityRegistryStorage.address);
  const tokenOID = await deployContract(chainId, accounts.deployer, 'TokenOID', OnchainID.contracts.IdentityProxy.abi, OnchainID.contracts.IdentityProxy.bytecode, identityImplementationAuthority.address, tokenIssuer.address);



  // ============================================================================================================================
  // Deploy A Token
  // ============================================================================================================================  


  const tokenName = 'TREXDINO';
  const tokenSymbol = 'TREX';
  const tokenDecimals = '0' //BigNumber.from('0');
  const token = await
    deployContract(
      chainId,
      accounts.deployer,
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
  const agentManager = await deployContract(chainId, accounts.deployer, 'AgentManager', AgentManager.abi, AgentManager.bytecode, token.address);

  // Use the implementation ABI at the proxy address to call bindIdentityRegistry
  const identityRegistryStorageAtProxy = new ethers.Contract(
    identityRegistryStorage.address, // proxy address
    IdentityRegistryStorage.abi,     // implementation ABI
    await getSigner(accounts.deployer, chainId)
  );
  await identityRegistryStorageAtProxy.bindIdentityRegistry(identityRegistry.address);

  // Use the implementation ABI at the proxy address to call addAgent
  const tokenAtProxy = async () => new ethers.Contract(
    token.address, // proxy address
    Token.abi,     // implementation ABI
    await getSigner(accounts.deployer, chainId)
  );

  const addTokenAgentResult = await (await tokenAtProxy()).addAgent(tokenAgent.address);
  // await (await tokenAtProxy()).addAgent(agentManager.address);
  console.log('!!!addTokenAgentResult', addTokenAgentResult.hash);

  const claimTopics = [id('CLAIM_TOPIC')];
  const claimTopicsRegistryAtProxy = new ethers.Contract(
    claimTopicsRegistry.address, // proxy address
    ClaimTopicsRegistry.abi,     // implementation ABI
    await getSigner(accounts.deployer, chainId)
  );
  await claimTopicsRegistryAtProxy.addClaimTopic(claimTopics[0]);

  const claimIssuerContract = await deployContract(chainId, accounts.deployer, 'ClaimIssuer', OnchainID.contracts.ClaimIssuer.abi, OnchainID.contracts.ClaimIssuer.bytecode, claimIssuer.address);


  await (await claimIssuerContract.getContract(claimIssuer)).addKey(encodeAddress(claimIssuerSigningKey.address), 3, 1);
  // await (await claimIssuerContract.getContract(claimIssuer)).addKey(encodeAddress(claimIssuer.address), 3, 1);

  const trustedIssuersRegistryAtProxy = new ethers.Contract(
    trustedIssuersRegistry.address, // proxy address
    TrustedIssuersRegistry.abi,     // implementation ABI
    await getSigner(accounts.deployer, chainId)
  );
  await trustedIssuersRegistryAtProxy.addTrustedIssuer(claimIssuerContract.address, claimTopics);



  // moved from the accounts section, lines 132 - 133 in deploy-full-suite.fixture.ts

  // Human/operator account for privileged actions - being added to manage identities, perform compliance operations, etc.
  const identityRegistryAtProxy = async () => {
    return new ethers.Contract(
      identityRegistry.address, // proxy address
      IdentityRegistry.abi,     // implementation ABI
      await getSigner(accounts.deployer, chainId)
    );
  }
  await (await identityRegistryAtProxy()).addAgent(tokenAgent.address);
  await (await identityRegistryAtProxy()).addAgent(token.address);

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

export type UserAccounts = {
  alice: Persona;
  bob: Persona;
  charlie: Persona;
}



export async function setupAccounts(chainId: string, admin: Accounts, users: UserAccounts, trex: TrexSuite) {


  async function deployIdentityProxy(user: PrivateAccount): Promise<Deployed> {
    const managementKey = user.address;

    console.log('deploying identity proxy for', user.address);
    const implementationAuthorityContractAddress = trex.authorities.identityImplementationAuthority.address

    const identity = await new ContractFactory(OnchainID.contracts.IdentityProxy.abi, OnchainID.contracts.IdentityProxy.bytecode, await getSigner(admin.deployer, chainId)).deploy(
      implementationAuthorityContractAddress,
      managementKey,
    );

    // TODO - register this contract

    await identity.waitForDeployment();

    // return ethers.getContractAt('Identity', identity.address, signer);
    return {
      address: await identity.getAddress(),
      // contract: new ethers.Contract(await identity.getAddress(), OnchainID.contracts.Identity.abi, await getSigner(user, chainId))
      getContract: async (account: PrivateAccount) => {
        return new ethers.Contract(await identity.getAddress(), OnchainID.contracts.Identity.abi, await getSigner(account, chainId))
      }
    }
  }

  console.log('deploying accounts for ', users);

  const aliceIdentity = await deployIdentityProxy(users.alice.personalAccount);
  // await aliceIdentity.addKey(ethers.utils.keccak256(ethers.utils.defaultAbiCoder.encode(['address'], [users.alice.actionAccount.address])), 2, 1);
  // the first arg is 1, 2 or 3
  // 1 is the key type for management keys
  // 2 is the key type for action keys
  // 3 is the key type for claim keys
  //
  // the second arg is the key type
  // 1 is ECDSA
  // 2 is RSA
  //
  console.log('adding key to alice identity', users.alice.actionAccount.address);
  const aliceAddKeyResult = await (await aliceIdentity.getContract(users.alice.personalAccount)).addKey(encodeAddress(users.alice.actionAccount.address), 2, 1);
  console.log('aliceAddKeyResult', aliceAddKeyResult.hash);

  const bobIdentity = await deployIdentityProxy(users.bob.personalAccount);
  const charlieIdentity = await deployIdentityProxy(users.charlie.personalAccount);

  console.log('adding key to charlie identity', users.charlie.actionAccount.address);
  const charlieAddKeyResult = await (await charlieIdentity.getContract(users.charlie.personalAccount)).addKey(encodeAddress(users.charlie.actionAccount.address), 2, 1);
  console.log('charlieAddKeyResult', charlieAddKeyResult.hash);


  // these are tuples of wallet addresses, on-chain identity addresses, and country codes


  const identityRegistryAtProxy = async () => {
    return new ethers.Contract(
      trex.suite.identityRegistry.address, // proxy address
      IdentityRegistry.abi,     // implementation ABI
      await getSigner(admin.tokenAgent, chainId) // <--- NOTE: this has to be the tokenAgent account (not the deployer) to register identities
    );
  }

  // const registryResult = await (await identityRegistryAtProxy()).batchRegisterIdentity([users.alice.personalAccount.address, users.bob.personalAccount.address], [aliceIdentity.address, bobIdentity.address], [42, 666]);
  // const registryResult = await (await trex.implementations.identityRegistryImplementation.getContract(admin.tokenAgent)).batchRegisterIdentity([users.alice.personalAccount.address, users.bob.personalAccount.address], [await aliceIdentity.getAddress(), await bobIdentity.getAddress()], [42, 666]);
  const registryResult = await (await identityRegistryAtProxy()).batchRegisterIdentity([users.alice.personalAccount.address, users.bob.personalAccount.address], [aliceIdentity.address, bobIdentity.address], [42, 666]);

  console.log('registryResult', registryResult.hash);

  const textAsHex = (text: string) => ethers.hexlify(ethers.toUtf8Bytes(text))

  const claimForAlice = {
    data: textAsHex('Some claim public data.'),
    issuer: trex.suite.claimIssuerContract.address,
    topic: id('CLAIM_TOPIC'),
    scheme: 1,
    identity: await aliceIdentity.address,
    signature: '',
  };

  const claimIssuerSigningKey = await getSigner(admin.claimIssuerSigningKey, chainId)

  console.log('signing... claim for alice');
  const abiByteString = ethers.AbiCoder.defaultAbiCoder().encode(['address', 'uint256', 'bytes'], [claimForAlice.identity, claimForAlice.topic, claimForAlice.data]);
  claimForAlice.signature = await claimIssuerSigningKey.signMessage(
    ethers.getBytes(
      ethers.keccak256(
        abiByteString,
      ),
    ),
  );

  console.log('adding claim for alice');
  const aliceAddClaimResult = await (await aliceIdentity.getContract(users.alice.personalAccount))
    .addClaim(claimForAlice.topic, claimForAlice.scheme, claimForAlice.issuer, claimForAlice.signature, claimForAlice.data, '');
  console.log('aliceAddClaimResult', aliceAddClaimResult.hash);

  // console.log('creating claim for bob');
  // const claimForBob = {
  //     data: textAsHex('Some claim public data.'),
  //     issuer: trex.suite.claimIssuerContract.address,
  //     topic: id('CLAIM_TOPIC'),
  //     scheme: 1,
  //     identity: bobIdentity.address,
  //     signature: '',
  // };
  // claimForBob.signature = await claimIssuerSigningKey.signMessage(
  //     ethers.getBytes(
  //         ethers.keccak256(
  //             abiByteString,
  //         ),
  //     ),
  // );

  // console.log('adding claim for bob');
  // (await bobIdentity.getContract(users.bob.actionAccount))
  //     .addClaim(claimForBob.topic, claimForBob.scheme, claimForBob.issuer, claimForBob.signature, claimForBob.data, '');

  const tokenAtProxyForCheck = new ethers.Contract(trex.suite.token.address, Token.abi, await getSigner(admin.tokenAgent, chainId));
  const isAgent = await tokenAtProxyForCheck.isAgent(admin.tokenAgent.address);
  console.log("Is tokenAgent an agent?", isAgent); // Should be true




  // await (await trex.suite.agentManager.getContract(admin.tokenAgent)).addAgentAdmin(admin.tokenAdmin.address);
  // await (await trex.suite.token.getContract(admin.tokenAgent)).addAgent(trex.suite.agentManager.address);
  // await (await trex.suite.identityRegistry.getContract(admin.tokenAgent)).addAgent(trex.suite.agentManager.address);

  // await (await trex.suite.token.getContract(admin.tokenAgent)).unpause();

  // const isPaused = await (await trex.suite.token.getContract(admin.tokenAgent)).paused();
  // console.log('Token paused:', isPaused);


  // console.log('minting 1000 for alice');


  // // Mint tokens for Alice using the implementation ABI at the proxy address
  const tokenAtProxy = new ethers.Contract(
    trex.suite.token.address, // proxy address
    Token.abi,                // implementation ABI
    await getSigner(admin.tokenAgent, chainId)
  );


  const balanceResultBefore = await tokenAtProxy.balanceOf(users.alice.personalAccount.address);
  console.log('before mint, balanceResult', balanceResultBefore);

  const mintResult = await tokenAtProxy.mint(users.alice.personalAccount.address, 1000);
  console.log('mintResult', mintResult.hash);
  // await token.connect(tokenAgent).mint(bobWallet.address, 500);

  const balanceResult = await tokenAtProxy.balanceOf(users.alice.personalAccount.address);
  console.log('after mint, balanceResult', balanceResult);

  // await (await trex.suite.agentManager.getContract(admin.deployer)).addAgentAdmin(admin.tokenAdmin.address);
  // await (await trex.suite.token.getContract(admin.deployer)).addAgent(trex.suite.agentManager.address);
  // await (await trex.suite.identityRegistry.getContract(admin.deployer)).addAgent(trex.suite.agentManager.address);

  // const unpauseResult = await (await trex.suite.token.getContract(admin.tokenAgent)).unpause();
  // console.log('unpauseResult', unpauseResult);
  // console.log('unpauseResult', unpauseResult.hash);

  return {
    identities: {
      aliceIdentity: aliceIdentity.address,
      // bob: bobIdentity,
      // charlie: charlieIdentity,
    }
  }

}
