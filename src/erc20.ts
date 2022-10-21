import { ERC20, StakeERC20 } from "../generated/schema";
import { Stake } from "../generated/templates/StakeERC20Template/Stake";
import { Transfer } from "../generated/templates/ERC20Template/ERC20";
import { ZERO_BI } from "./utils";
import {
  getStakeDeposit,
  loadStakeHolder,
  getStakeWithdraw,
} from "./stake/Stake";

export function handleTransfer(event: Transfer): void {
  let erc20 = ERC20.load(event.address.toHex());
  if (erc20) {
    let stakeContracts = erc20.stakeContracts;
    if (stakeContracts && stakeContracts.includes(event.params.to.toHex())) {
      let stakeERC20 = StakeERC20.load(event.params.to.toHex());
      if (stakeERC20) {
        let stakeContract = Stake.bind(event.params.to);
        stakeERC20.tokenPoolSize = stakeERC20.tokenPoolSize.plus(
          event.params.value
        );
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
        stakeERC20.save();
      }

      // Get Deposit
      let stakeDeposit = getStakeDeposit(event.transaction.hash.toHex());

      if (stakeDeposit) {
        stakeDeposit.depositedAmount = event.params.value;
        stakeDeposit.save();
      }

      // Get StakeHolder
      let stakeHolder = loadStakeHolder(
        event.params.to.toHex() + "-" + event.params.from.toHex()
      );

      if (stakeHolder) {
        stakeHolder.totalStake = stakeHolder.totalStake.plus(
          event.params.value
        );

        stakeHolder.save();
      }
    }

    if (stakeContracts && stakeContracts.includes(event.params.from.toHex())) {
      let stakeERC20 = StakeERC20.load(event.params.from.toHex());
      if (stakeERC20) {
        let stakeContract = Stake.bind(event.params.from);
        stakeERC20.tokenPoolSize = stakeERC20.tokenPoolSize.minus(
          event.params.value
        );
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
        stakeERC20.save();
      }

      // Get Withdraw
      let stakeWithdraw = getStakeWithdraw(event.transaction.hash.toHex());

      if (stakeWithdraw) {
        stakeWithdraw.returnedAmount = event.params.value;
        stakeWithdraw.save();
      }

      // Get StakeHolder
      let stakeHolder = loadStakeHolder(
        event.params.from.toHex() + "-" + event.params.to.toHex()
      );

      if (stakeHolder) {
        stakeHolder.totalStake = stakeHolder.totalStake.minus(
          event.params.value
        );

        stakeHolder.save();
      }
    }
  }
}
