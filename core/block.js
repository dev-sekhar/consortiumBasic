// core/block.js
const crypto = require("crypto");

/**
 * @class Block
 * @desc Represents a block in the blockchain.
 */
class Block {
  /**
   * @constructor
   * @param {number} index - The block's index in the chain.
   * @param {number} timestamp - The timestamp of the block's creation.
   * @param {Array<Transaction>} transactions - The transactions included in the block.
   * @param {string} previousHash - The hash of the previous block.
   */
  constructor(index, timestamp, transactions, previousHash) {
    this.index = index;
    this.timestamp = timestamp;
    this.transactions = transactions;
    this.previousHash = previousHash;
    this.hash = this.calculateHash();
  }

  /**
   * @method calculateHash
   * @desc Calculates the hash of the block.
   * @returns {string} - The hash of the block.
   */
  calculateHash() {
    const data =
      this.index +
      this.timestamp +
      JSON.stringify(this.transactions) +
      this.previousHash;
    return crypto.createHash("sha256").update(data).digest("hex");
  }

  /**
   * @method toJSON
   * @desc Returns a JSON representation of the block (for serialization).
   * @returns {object} - The JSON representation of the block.
   */
  toJSON() {
    return {
      index: this.index,
      timestamp: this.timestamp,
      transactions: this.transactions.map((tx) =>
        tx.toJSON ? tx.toJSON() : tx
      ), // <-- Key change
      previousHash: this.previousHash,
      hash: this.hash,
    };
  }
}

module.exports = Block;
