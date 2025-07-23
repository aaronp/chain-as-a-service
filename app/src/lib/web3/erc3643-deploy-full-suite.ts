import { BytesLike, Contract, Interface, InterfaceAbi, Signer, Wallet, ethers } from 'ethers';
// import { ethers } from 'hardhat';
import OnchainID from '@onchain-id/solidity';
import { createNewAccount, PrivateAccount } from '@/ui/wallet/accounts';
import { getSigner } from './erc3643';

import ClaimTopicsRegistry from '@/contracts/erc3643/contracts/registry/implementation/ClaimTopicsRegistry.sol/ClaimTopicsRegistry.json';
import TrustedIssuersRegistry from '@/contracts/erc3643/contracts/registry/implementation/TrustedIssuersRegistry.sol/TrustedIssuersRegistry.json';
import IdentityRegistryStorage from '@/contracts/erc3643/contracts/registry/implementation/IdentityRegistryStorage.sol/IdentityRegistryStorage.json';
import IdentityRegistry from '@/contracts/erc3643/contracts/registry/implementation/IdentityRegistry.sol/IdentityRegistry.json';
import ModularCompliance from '@/contracts/erc3643/contracts/compliance/modular/ModularCompliance.sol/ModularCompliance.json';
import Token from '@/contracts/erc3643/contracts/token/Token.sol/Token.json';
import TREXImplementationAuthority from '@/contracts/erc3643/contracts/proxy/authority/TREXImplementationAuthority.sol/TREXImplementationAuthority.json';



// export async function deployIdentityProxy(implementationAuthority: Contract['address'], managementKey: string, signer: Signer) {
//   const identity = await new ethers.ContractFactory(OnchainID.contracts.IdentityProxy.abi, OnchainID.contracts.IdentityProxy.bytecode, signer).deploy(
//     implementationAuthority,
//     managementKey,
//   );

//   return ethers.getContractAt('Identity', identity.address, signer);
// }

type Accounts = {
  deployer: PrivateAccount;
  tokenIssuer: PrivateAccount;
  tokenAgent: PrivateAccount;
  tokenAdmin: PrivateAccount;
  claimIssuer: PrivateAccount;
}

export const newAccounts = async (): Promise<Accounts> => {

  return {
    deployer: await createNewAccount('Deployer'),
    tokenIssuer: await createNewAccount('TokenIssuer'),
    tokenAgent: await createNewAccount('TokenAgent'),
    tokenAdmin: await createNewAccount('TokenAdmin'),
    claimIssuer: await createNewAccount('ClaimIssuer'),
  }
}

type Deployed = {
  address: string;
  getContract: (account: PrivateAccount) => Promise<Contract>;
}

const deployContract = async (chainId: string, deployer: PrivateAccount, contractName: string, abi: Interface | InterfaceAbi, bytecode: BytesLike, ...args: any[]): Promise<Deployed> => {
  console.log(`Deploying ${contractName}...`);
  const signer = await getSigner(deployer, chainId);
  const contract = new ethers.ContractFactory(abi, bytecode, signer);
  const deployment = await contract.deploy(...args);
  await deployment.waitForDeployment();

  const address = await deployment.getAddress();

  return {
    address,
    getContract: async (account: PrivateAccount) => new ethers.Contract(address, abi, await getSigner(account, chainId)),
  };
}



export async function deployFullSuiteFixture(chainId: string, accounts: Accounts) {
  // const [deployer, tokenIssuer, tokenAgent, tokenAdmin, claimIssuer, aliceWallet, bobWallet, charlieWallet, davidWallet, anotherWallet] =
  //   await ethers.getSigners();
  const { deployer, tokenIssuer, tokenAgent, tokenAdmin, claimIssuer } = accounts;
  const claimIssuerSigningKey = ethers.Wallet.createRandom();
  const aliceActionKey = ethers.Wallet.createRandom();

  // Deploy implementations
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

  const asContract = () => {

  }


  console.log('addAndUseTREXVersion', trexImplementationAuthority);
  (await trexImplementationAuthority.getContract(deployer)).addAndUseTREXVersion(versionStruct, contractsStruct);

  // const trexFactory = await ethers.deployContract('TREXFactory', [trexImplementationAuthority.address, identityFactory.address], deployer);
  // await identityFactory.connect(deployer).addTokenFactory(trexFactory.address);

  // const claimTopicsRegistry = await ethers
  //   .deployContract('ClaimTopicsRegistryProxy', [trexImplementationAuthority.address], deployer)
  //   .then(async (proxy) => ethers.getContractAt('ClaimTopicsRegistry', proxy.address));

  // const trustedIssuersRegistry = await ethers
  //   .deployContract('TrustedIssuersRegistryProxy', [trexImplementationAuthority.address], deployer)
  //   .then(async (proxy) => ethers.getContractAt('TrustedIssuersRegistry', proxy.address));

  // const identityRegistryStorage = await ethers
  //   .deployContract('IdentityRegistryStorageProxy', [trexImplementationAuthority.address], deployer)
  //   .then(async (proxy) => ethers.getContractAt('IdentityRegistryStorage', proxy.address));

  // const defaultCompliance = await ethers.deployContract('DefaultCompliance', deployer);

  // const identityRegistry = await ethers
  //   .deployContract(
  //     'IdentityRegistryProxy',
  //     [trexImplementationAuthority.address, trustedIssuersRegistry.address, claimTopicsRegistry.address, identityRegistryStorage.address],
  //     deployer,
  //   )
  //   .then(async (proxy) => ethers.getContractAt('IdentityRegistry', proxy.address));

  // const tokenOID = await deployIdentityProxy(identityImplementationAuthority.address, tokenIssuer.address, deployer);
  // const tokenName = 'TREXDINO';
  // const tokenSymbol = 'TREX';
  // const tokenDecimals = BigNumber.from('0');
  // const token = await ethers
  //   .deployContract(
  //     'TokenProxy',
  //     [
  //       trexImplementationAuthority.address,
  //       identityRegistry.address,
  //       defaultCompliance.address,
  //       tokenName,
  //       tokenSymbol,
  //       tokenDecimals,
  //       tokenOID.address,
  //     ],
  //     deployer,
  //   )
  //   .then(async (proxy) => ethers.getContractAt('Token', proxy.address));

  // const agentManager = await ethers.deployContract('AgentManager', [token.address], tokenAgent);

  // await identityRegistryStorage.connect(deployer).bindIdentityRegistry(identityRegistry.address);

  // await token.connect(deployer).addAgent(tokenAgent.address);

  // const claimTopics = [ethers.utils.id('CLAIM_TOPIC')];
  // await claimTopicsRegistry.connect(deployer).addClaimTopic(claimTopics[0]);

  // const claimIssuerContract = await ethers.deployContract('ClaimIssuer', [claimIssuer.address], claimIssuer);
  // await claimIssuerContract
  //   .connect(claimIssuer)
  //   .addKey(ethers.utils.keccak256(ethers.utils.defaultAbiCoder.encode(['address'], [claimIssuerSigningKey.address])), 3, 1);

  // await trustedIssuersRegistry.connect(deployer).addTrustedIssuer(claimIssuerContract.address, claimTopics);

  // const aliceIdentity = await deployIdentityProxy(identityImplementationAuthority.address, aliceWallet.address, deployer);
  // await aliceIdentity
  //   .connect(aliceWallet)
  //   .addKey(ethers.utils.keccak256(ethers.utils.defaultAbiCoder.encode(['address'], [aliceActionKey.address])), 2, 1);
  // const bobIdentity = await deployIdentityProxy(identityImplementationAuthority.address, bobWallet.address, deployer);
  // const charlieIdentity = await deployIdentityProxy(identityImplementationAuthority.address, charlieWallet.address, deployer);

  // await identityRegistry.connect(deployer).addAgent(tokenAgent.address);
  // await identityRegistry.connect(deployer).addAgent(token.address);

  // await identityRegistry
  //   .connect(tokenAgent)
  //   .batchRegisterIdentity([aliceWallet.address, bobWallet.address], [aliceIdentity.address, bobIdentity.address], [42, 666]);

  // const claimForAlice = {
  //   data: ethers.utils.hexlify(ethers.utils.toUtf8Bytes('Some claim public data.')),
  //   issuer: claimIssuerContract.address,
  //   topic: claimTopics[0],
  //   scheme: 1,
  //   identity: aliceIdentity.address,
  //   signature: '',
  // };
  // claimForAlice.signature = await claimIssuerSigningKey.signMessage(
  //   ethers.utils.arrayify(
  //     ethers.utils.keccak256(
  //       ethers.utils.defaultAbiCoder.encode(['address', 'uint256', 'bytes'], [claimForAlice.identity, claimForAlice.topic, claimForAlice.data]),
  //     ),
  //   ),
  // );

  // await aliceIdentity
  //   .connect(aliceWallet)
  //   .addClaim(claimForAlice.topic, claimForAlice.scheme, claimForAlice.issuer, claimForAlice.signature, claimForAlice.data, '');

  // const claimForBob = {
  //   data: ethers.utils.hexlify(ethers.utils.toUtf8Bytes('Some claim public data.')),
  //   issuer: claimIssuerContract.address,
  //   topic: claimTopics[0],
  //   scheme: 1,
  //   identity: bobIdentity.address,
  //   signature: '',
  // };
  // claimForBob.signature = await claimIssuerSigningKey.signMessage(
  //   ethers.utils.arrayify(
  //     ethers.utils.keccak256(
  //       ethers.utils.defaultAbiCoder.encode(['address', 'uint256', 'bytes'], [claimForBob.identity, claimForBob.topic, claimForBob.data]),
  //     ),
  //   ),
  // );

  // await bobIdentity
  //   .connect(bobWallet)
  //   .addClaim(claimForBob.topic, claimForBob.scheme, claimForBob.issuer, claimForBob.signature, claimForBob.data, '');

  // await token.connect(tokenAgent).mint(aliceWallet.address, 1000);
  // await token.connect(tokenAgent).mint(bobWallet.address, 500);

  // await agentManager.connect(tokenAgent).addAgentAdmin(tokenAdmin.address);
  // await token.connect(deployer).addAgent(agentManager.address);
  // await identityRegistry.connect(deployer).addAgent(agentManager.address);

  // await token.connect(tokenAgent).unpause();

  // return {
  //   accounts: {
  //     deployer,
  //     tokenIssuer,
  //     tokenAgent,
  //     tokenAdmin,
  //     claimIssuer,
  //     claimIssuerSigningKey,
  //     aliceActionKey,
  //     aliceWallet,
  //     bobWallet,
  //     charlieWallet,
  //     davidWallet,
  //     anotherWallet,
  //   },
  //   identities: {
  //     aliceIdentity,
  //     bobIdentity,
  //     charlieIdentity,
  //   },
  //   suite: {
  //     claimIssuerContract,
  //     claimTopicsRegistry,
  //     trustedIssuersRegistry,
  //     identityRegistryStorage,
  //     defaultCompliance,
  //     identityRegistry,
  //     tokenOID,
  //     token,
  //     agentManager,
  //   },
  //   authorities: {
  //     trexImplementationAuthority,
  //     identityImplementationAuthority,
  //   },
  //   factories: {
  //     trexFactory,
  //     identityFactory,
  //   },
  //   implementations: {
  //     identityImplementation,
  //     claimTopicsRegistryImplementation,
  //     trustedIssuersRegistryImplementation,
  //     identityRegistryStorageImplementation,
  //     identityRegistryImplementation,
  //     modularComplianceImplementation,
  //     tokenImplementation,
  //   },
  // };



  return {
    accounts: {
      deployer,
      tokenIssuer,
      tokenAgent,
      tokenAdmin,
      claimIssuer,
      claimIssuerSigningKey,
      aliceActionKey,
    },
    authorities: {
      trexImplementationAuthority,
      identityImplementationAuthority,
    },
    factories: {
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

// export async function deploySuiteWithModularCompliancesFixture() {
//   const context = await loadFixture(deployFullSuiteFixture);

//   const complianceProxy = await ethers.deployContract('ModularComplianceProxy', [context.authorities.trexImplementationAuthority.address]);
//   const compliance = await ethers.getContractAt('ModularCompliance', complianceProxy.address);

//   const complianceBeta = await ethers.deployContract('ModularCompliance');
//   await complianceBeta.init();

//   return {
//     ...context,
//     suite: {
//       ...context.suite,
//       compliance,
//       complianceBeta,
//     },
//   };
// }

// export async function deploySuiteWithModuleComplianceBoundToWallet() {
//   const context = await loadFixture(deployFullSuiteFixture);

//   const compliance = await ethers.deployContract('ModularCompliance');
//   await compliance.init();

//   const complianceModuleA = await ethers.deployContract('CountryAllowModule');
//   await compliance.addModule(complianceModuleA.address);
//   const complianceModuleB = await ethers.deployContract('CountryAllowModule');
//   await compliance.addModule(complianceModuleB.address);

//   await compliance.bindToken(context.accounts.charlieWallet.address);

//   return {
//     ...context,
//     suite: {
//       ...context.suite,
//       compliance,
//       complianceModuleA,
//       complianceModuleB,
//     },
//   };
// }
