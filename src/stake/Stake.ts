import { log } from "@graphprotocol/graph-ts";
import {
  StakeDeposit,
  StakeERC20,
  StakeHolder,
  StakeWithdraw,
} from "../../generated/schema";
import {
  Initialize,
  Approval,
  Transfer,
  Stake,
} from "../../generated/templates/StakeERC20Template/Stake";
import { getERC20, ZERO_ADDRESS, ZERO_BI } from "../utils";

export function handleInitialize(event: Initialize): void {
  let stakeContract = Stake.bind(event.address);
  let stakeERC20 = StakeERC20.load(event.address.toHex());
  if (stakeERC20) {
    stakeERC20.name = event.params.config.name;
    stakeERC20.symbol = event.params.config.symbol;
    stakeERC20.decimals = stakeContract.decimals();
    stakeERC20.totalSupply = stakeContract.totalSupply();
    stakeERC20.initialRatio = event.params.config.initialRatio;

    let token = getERC20(event.params.config.token, event.block);
    if (token) {
      stakeERC20.token = token.id;
      let stakeContracts = token.stakeContracts;
      if (stakeContracts && !stakeContracts.includes(stakeERC20.id))
        stakeContracts.push(stakeERC20.id);
      token.stakeContracts = stakeContracts;
      token.save();
    }

    stakeERC20.save();
  }
}

export function handleApproval(event: Approval): void {
  //
}

export function handleTransfer(event: Transfer): void {
  let stakeERC20 = StakeERC20.load(event.address.toHex());
  let stakeContract = Stake.bind(event.address);

  if (stakeERC20) {
    stakeERC20.totalSupply = stakeContract.totalSupply();

    if (stakeERC20.tokenPoolSize != ZERO_BI) {
      stakeERC20.tokenToStakeTokenRatio = stakeERC20.totalSupply.div(
        stakeERC20.tokenPoolSize
      );
    }

    if (stakeERC20.totalSupply != ZERO_BI) {
      stakeERC20.stakeTokenToTokenRatio = stakeERC20.tokenPoolSize.div(
        stakeERC20.totalSupply
      );
    }

    if (event.params.from.toHex() == ZERO_ADDRESS) {
      // Deposit
      let stakeDeposit = new StakeDeposit(event.transaction.hash.toHex());
      stakeDeposit.depositor =
        event.address.toHex() + "-" + event.params.to.toHex();
      stakeDeposit.stakeToken = event.address.toHex();
      stakeDeposit.token = stakeERC20.token;
      stakeDeposit.stakeTokenMinted = event.params.value;
      stakeDeposit.timestamp = event.block.timestamp;
      stakeDeposit.tokenPoolSize = stakeERC20.tokenPoolSize;
      stakeDeposit.value = event.params.value;
      stakeDeposit.save();

      stakeERC20.save();
    }

    if (event.params.to.toHex() == ZERO_ADDRESS) {
      // Deposit
      let stakeWithdraw = new StakeWithdraw(event.transaction.hash.toHex());
      stakeWithdraw.withdrawer =
        event.address.toHex() + "-" + event.params.from.toHex();
      stakeWithdraw.stakeToken = event.address.toHex();
      stakeWithdraw.token = stakeERC20.token;
      stakeWithdraw.stakeTokenMinted = event.params.value;
      stakeWithdraw.timestamp = event.block.timestamp;
      stakeWithdraw.tokenPoolSize = stakeERC20.tokenPoolSize;
      stakeWithdraw.value = event.params.value;
      stakeWithdraw.save();

      stakeERC20.save();
    }

    if (event.params.to.toHex() != ZERO_ADDRESS) {
      let stakeHolder = StakeHolder.load(
        event.address.toHex() + "-" + event.params.to.toHex()
      );
      if (!stakeHolder) {
        stakeHolder = new StakeHolder(
          event.address.toHex() + "-" + event.params.to.toHex()
        );
        stakeHolder.address = event.params.to;
        stakeHolder.token = stakeERC20.id;
        stakeHolder.balance = ZERO_BI;
        stakeHolder.stakeToken = stakeERC20.id;
        stakeHolder.totalStake = ZERO_BI;
      }
      stakeHolder.balance = stakeHolder.balance.plus(event.params.value);
      if (stakeERC20.totalSupply != ZERO_BI) {
        stakeHolder.totalEntitlement = stakeHolder.balance
          .times(stakeERC20.tokenPoolSize)
          .div(stakeERC20.totalSupply);
      }
      stakeHolder.totalStake = stakeHolder.totalStake.plus(event.params.value);
      stakeHolder.save();
    }

    if (event.params.from.toHex() != ZERO_ADDRESS) {
      let stakeHolder = StakeHolder.load(
        event.address.toHex() + "-" + event.params.from.toHex()
      );
      if (stakeHolder) {
        stakeHolder.balance = stakeHolder.balance.minus(event.params.value);
        if (stakeERC20.totalSupply != ZERO_BI) {
          stakeHolder.totalEntitlement = stakeHolder.balance
            .times(stakeERC20.tokenPoolSize)
            .div(stakeERC20.totalSupply);
        }
        stakeHolder.totalStake = stakeHolder.totalStake.minus(
          event.params.value
        );
        stakeHolder.save();
      }
    }
  }
}