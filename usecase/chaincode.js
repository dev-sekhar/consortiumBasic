/**
 * @class Chaincode
 * @desc Contains the business logic (similar to smart contracts).
 */
const Transaction = require("../core/transaction"); // Correct default import (no curly braces)

class Chaincode {
  /**
   * @constructor
   * @param {Blockchain} blockchain - The blockchain instance to use.
   */
  constructor(blockchain) {
    this.blockchain = blockchain;
  }

  /**
   * @method createTransaction
   * @desc Creates a new transaction.
   * @param {string} from - Sender address.
   * @param {string} to - Recipient address.
   * @param {number} amount - Amount to transfer.
   */
  async createTransaction(transaction) {
    try {
        await this.blockchain.createTransaction(transaction);
        console.info("Chaincode: Transaction created and added to blockchain:", transaction);
    } catch (error) {
        console.error("Chaincode: Error creating transaction:", error);
        throw error;
    }
}

  /**
   * @method mineBlock
   * @desc Mines a new block.
   */
  mineBlock() {
    this.blockchain.minePendingTransactions();
    console.info("Chaincode: Block mined."); // Logging
  }

  /**
   * @method getChain
   * @desc Gets the entire blockchain.
   * @returns {Array<Block>} - The blockchain.
   */
  getChain() {
    console.info("Chaincode: Getting blockchain."); // Logging
    return this.blockchain.chain;
  }
}

module.exports = { Chaincode };
