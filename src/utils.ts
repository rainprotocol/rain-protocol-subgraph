import { Address, BigDecimal, BigInt, ethereum } from "@graphprotocol/graph-ts";
import {
  Sale,
  ERC20,
  RedeemableERC20 as RedeemableERC20Contract,
} from "../generated/schema";
import { ERC20 as ERC20Contract } from "../generated/RedeemableERC20ClaimEscrow/ERC20";

let ZERO_BI = BigInt.fromI32(0);
let ONE_BI = BigInt.fromI32(1);
let ZERO_BD = BigDecimal.fromString("0.0");
let ZERO_ADDRESS = "0x0000000000000000000000000000000000000000";
let HUNDRED_BD = BigDecimal.fromString("100.0");
let ETHER = BigInt.fromString("1000000000000000000");

let BONE = BigInt.fromString("1000000000000000000");

// enum for SaleStatus on Trust and Sale
export enum SaleStatus {
  Pending,
  Active,
  Success,
  Fail,
}

// enum for RequestStatus on VerifyAddresses
export enum RequestStatus {
  NONE,
  APPROVE,
  BAN,
  REMOVE,
}

// enum for Status on VerifyAddresses
export enum Status {
  NIL,
  ADDED,
  APPROVED,
  BANNED,
}

export enum Transferrable {
  NonTransferrable,
  Transferrable,
  TierGatedTransferrable,
}

export enum Role {
  NONE,
  APPROVER_ADMIN,
  REMOVER_ADMIN,
  BANNER_ADMIN,
  APPROVER,
  REMOVER,
  BANNER,
}

// enum for DistributionStatus on Trust
export enum DistributionStatus {
  Pending,
  Seeded,
  Trading,
  TradingCanEnd,
  Success,
  Fail,
}

/// Role for `APPROVER_ADMIN`.
let APPROVER_ADMIN =
  "0x2d4d1d70bd81797c3479f5c3f873a5c9203d249659c3b317cdad46367472783c";
/// Role for `APPROVER`.
let APPROVER =
  "0x5ff1fb0ce9089603e6e193667ed17164e0360a6148f4a39fc194055588948a31";

/// Admin role for `REMOVER`.
let REMOVER_ADMIN =
  "0x9d65f741849e7609dd1e2c70f0d7da5f5433b36bfcf3ba4d27d2bb08ad2155b1";
/// Role for `REMOVER`.
let REMOVER =
  "0x794e4221ebb6dd4e460d558b4ec709511d44017d6610ba89daa896c0684ddfac";

/// Admin role for `BANNER`.
let BANNER_ADMIN =
  "0xbb496ca6fee71a17f78592fbc6fc7f04a436edb9c709c4289d6bbfbc5fd45f4d";
/// Role for `BANNER`.
let BANNER =
  "0x5a686c9d070917be517818979fb56f451f007e3ae83e96fb5a22a304929b070d";

export {
  ZERO_BI,
  ONE_BI,
  ZERO_BD,
  HUNDRED_BD,
  ZERO_ADDRESS,
  ETHER,
  BONE,
  APPROVER_ADMIN,
  APPROVER,
  REMOVER_ADMIN,
  REMOVER,
  BANNER_ADMIN,
  BANNER,
};

/**
* @description A function to chechk if a given address is not a ZERO_ADDRESSE
                or contract address for the given Trust.
* @param address Address of user.
* @param trust Address of Trust.
* @returns True if not any contract address or ZERO_ADDRESSE else False.
*/
export function notAContract(address: string): boolean {
  let sale = Sale.load(address);
  if (sale) return false;

  let redeemableERC20 = RedeemableERC20Contract.load(address);
  if (redeemableERC20) return false;

  return true;
}

export function getERC20(token: Address, block: ethereum.Block): ERC20 {
  let erc20 = ERC20.load(token.toHex());
  let erc20Contract = ERC20Contract.bind(token);
  if (erc20 == null) {
    erc20 = new ERC20(token.toHex());
    erc20.deployBlock = block.number;
    erc20.deployTimestamp = block.timestamp;

    let name = erc20Contract.try_name();
    let symbol = erc20Contract.try_symbol();
    let decimals = erc20Contract.try_decimals();
    let totalSupply = erc20Contract.try_totalSupply();
    if (
      !(
        name.reverted ||
        symbol.reverted ||
        decimals.reverted ||
        totalSupply.reverted
      )
    ) {
      erc20.name = name.value;
      erc20.symbol = symbol.value;
      erc20.decimals = decimals.value;
      erc20.totalSupply = totalSupply.value;
    }
    erc20.save();
  }
  return erc20 as ERC20;
}
