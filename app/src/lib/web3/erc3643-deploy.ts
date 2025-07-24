import { BytesLike, Contract, Interface, InterfaceAbi, id, ethers, keccak256, AbiCoder } from 'ethers';
// import { ethers } from 'hardhat';
import OnchainID from '@onchain-id/solidity';
import { Accounts, Deployed, encodeAddress, getSigner, TrexSuite } from './erc3643';
import { PrivateAccount } from '@/ui/wallet/accounts';
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

  const { deployer, tokenIssuer, claimIssuer, tokenAgent } = accounts;
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


  await (await claimIssuerContract.getContract(claimIssuer)).addKey(encodeAddress(claimIssuerSigningKey.address), 3, 1);

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
