import { id, ContractFactory, ethers, Signer, Contract } from "ethers";
import { Accounts, Deployed, encodeAddress, getSigner, TrexSuite } from "./erc3564/erc3643";
import OnchainID from '@onchain-id/solidity';
import { newAccount, PrivateAccount } from "@/ui/wallet/accounts";
import IdentityRegistry from '@/contracts/erc3643/contracts/registry/implementation/IdentityRegistry.sol/IdentityRegistry.json';
import Token from '@/contracts/erc3643/contracts/token/Token.sol/Token.json';
