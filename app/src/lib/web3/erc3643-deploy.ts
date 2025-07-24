import { BytesLike, Contract, Interface, InterfaceAbi, id, ethers, keccak256, AbiCoder } from 'ethers';
// import { ethers } from 'hardhat';
import OnchainID from '@onchain-id/solidity';
import { Accounts, Deployed, getSigner, TrexSuite } from './erc3643';
import { createNewAccount, PrivateAccount } from '@/ui/wallet/accounts';
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
// import ClaimIssuer from '@/contracts/erc3643/contracts/roles/claim/ClaimIssuer.sol/ClaimIssuer.json';


// export async function deployIdentityProxy(implementationAuthority: Contract['address'], managementKey: string, signer: Signer) {
//   const identity = await new ethers.ContractFactory(OnchainID.contracts.IdentityProxy.abi, OnchainID.contracts.IdentityProxy.bytecode, signer).deploy(
//     implementationAuthority,
//     managementKey,
//   );

//   return ethers.getContractAt('Identity', identity.address, signer);
// }


const deployContract = async (chainId: string, deployer: PrivateAccount, contractName: string, abi: Interface | InterfaceAbi, bytecode: BytesLike, ...args: any[]): Promise<Deployed> => {
  console.log(`Deploying ${contractName}...`);
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

  const contract = new ethers.ContractFactory(abi, bytecode, signer);
  const deployment = await contract.deploy(...args);
  await deployment.waitForDeployment();


  const address = await deployment.getAddress();

  return {
    address,
    getContract: async (account: PrivateAccount) => new ethers.Contract(address, abi, await getSigner(account, chainId)),
  };
}

export async function deployTrexSuite(chainId: string, accounts: Accounts): Promise<TrexSuite> {

  const { deployer, tokenIssuer, claimIssuer } = accounts;
  const claimIssuerSigningKey = ethers.Wallet.createRandom();

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

  const agentManager = await deployContract(chainId, accounts.deployer, 'AgentManager', AgentManager.abi, AgentManager.bytecode, token.address);

  // Use the implementation ABI at the proxy address to call bindIdentityRegistry
  const identityRegistryStorageAtProxy = new ethers.Contract(
    identityRegistryStorage.address, // proxy address
    IdentityRegistryStorage.abi,     // implementation ABI
    await getSigner(accounts.deployer, chainId)
  );
  await identityRegistryStorageAtProxy.bindIdentityRegistry(identityRegistry.address);

  // Use the implementation ABI at the proxy address to call addAgent
  const tokenAtProxy = new ethers.Contract(
    token.address, // proxy address
    Token.abi,     // implementation ABI
    await getSigner(accounts.deployer, chainId)
  );
  await tokenAtProxy.addAgent(agentManager.address);

  const claimTopics = [id('CLAIM_TOPIC')];
  const claimTopicsRegistryAtProxy = new ethers.Contract(
    claimTopicsRegistry.address, // proxy address
    ClaimTopicsRegistry.abi,     // implementation ABI
    await getSigner(accounts.deployer, chainId)
  );
  await claimTopicsRegistryAtProxy.addClaimTopic(claimTopics[0]);

  const claimIssuerContract = await deployContract(chainId, accounts.deployer, 'ClaimIssuer', OnchainID.contracts.ClaimIssuer.abi, OnchainID.contracts.ClaimIssuer.bytecode, claimIssuer.address);

  const encodeAddress = (address: string) => {
    // 1. ABI-encode the address
    const abiCoder = AbiCoder.defaultAbiCoder();
    const encoded = abiCoder.encode(['address'], [address]);

    // 2. Hash the encoded address
    return keccak256(encoded);
  }

  await (await claimIssuerContract.getContract(claimIssuer)).addKey(encodeAddress(claimIssuerSigningKey.address), 3, 1);

  const trustedIssuersRegistryAtProxy = new ethers.Contract(
    trustedIssuersRegistry.address, // proxy address
    TrustedIssuersRegistry.abi,     // implementation ABI
    await getSigner(accounts.deployer, chainId)
  );
  await trustedIssuersRegistryAtProxy.addTrustedIssuer(claimIssuerContract.address, claimTopics);



  return {
    // accounts: {
    //   deployer,
    //   tokenIssuer,
    //   tokenAgent,
    //   tokenAdmin,
    //   claimIssuer,
    //   claimIssuerSigningKey,
    //   aliceActionKey,
    //   // aliceWallet,
    //   // bobWallet,
    //   // charlieWallet,
    //   // davidWallet,
    //   // anotherWallet,
    // },
    // identities: {
    // aliceIdentity,
    // bobIdentity,
    // charlieIdentity,
    // },
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
