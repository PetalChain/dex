const fixedSupplyToken = artifacts.require("./FixedSupplyToken.sol");
const exchange = artifacts.require("./Exchange.sol");

contract('Exchange - deposit Ether into DEX from an account address and then withdraw it again', (accounts) => {

    it("should be possible to Deposit and Withdrawal Ether", () => {
        let myExchangeInstance;
        const balanceBeforeTransaction = web3.eth.getBalance(accounts[0]);
        let balanceAfterDeposit;
        let balanceAfterWithdrawal;
        let totalGasCostAccumulated = 0;

        return exchange.deployed().then((instance) => {
            myExchangeInstance = instance;

            // DEPOSIT INTO DEX FROM A GIVEN ACCOUNT ADDRESS
            return myExchangeInstance.depositEther({from: accounts[0], value: web3.toWei(1, "ether")});
        }).then((txHash) => {
            totalGasCostAccumulated += txHash.receipt.cumulativeGasUsed * web3.eth.getTransaction(txHash.receipt.transactionHash).gasPrice.toNumber();
            balanceAfterDeposit = web3.eth.getBalance(accounts[0]);
            return myExchangeInstance.getEthBalanceInWei.call();
        }).then((balanceInWei) => {
            // Check DEX balance in Ether for the account calling the function
            assert.equal(balanceInWei.toNumber(), web3.toWei(1, "ether"), "DEX has one Ether available");
            // Check that at least the Deposited value (excluding gas costs) was take out of the account of the sender  
            assert.isAtLeast(
              balanceBeforeTransaction.toNumber() - balanceAfterDeposit.toNumber(), 
              web3.toWei(1, "ether"), 
              "Deposited at least one Ether from the sender account address"
            );
            
            // WITHDRAW FROM DEX TO THE ACCOUNT ADDRESS OF THE CALLER
            return myExchangeInstance.withdrawEther(web3.toWei(1, "ether"));
        }).then((txHash) => {
            totalGasCostAccumulated += txHash.receipt.cumulativeGasUsed * web3.eth.getTransaction(txHash.receipt.transactionHash).gasPrice.toNumber();
            balanceAfterWithdrawal = web3.eth.getBalance(accounts[0]);
            return myExchangeInstance.getEthBalanceInWei.call();
        }).then((balanceInWei) => {
            assert.equal(balanceInWei.toNumber(), 0, "DEX has no Ether available anymore");
            assert.isAtLeast(
              balanceAfterWithdrawal.toNumber(), 
              balanceBeforeTransaction.toNumber() - totalGasCostAccumulated, 
              "User Account Balance after Depositing an amount of Ether into the DEX and then Withdrawing the same amount is at least their initial balance minus the total Gas Cost of both transactions"
            );
        });
    });
});