const crypto = require("crypto");

class Blockchain {
  constructor() {
    this.chain = [];
    this.pendingTransactions = [];
    this.miningQueue = [];
  }

  createGenesisBlock(transactions) {
    return this.createBlock(transactions, "0");
  }

  createBlock(transactions, previousHash) {
    const block = {
      index: this.chain.length,
      timestamp: Date.now(),
      transactions,
      previousHash,
      hash: this.calculateHash(
        this.chain.length,
        Date.now(),
        transactions,
        previousHash
      ),
    };
    this.chain.push(block);
    return block;
  }

  calculateHash(index, timestamp, transactions, previousHash) {
    return crypto
      .createHash("sha256")
      .update(index + timestamp + JSON.stringify(transactions) + previousHash)
      .digest("hex");
  }

  minePendingTransactions() {
    if (this.miningQueue.length === 0) {
      console.info("No transactions in the mining queue. Skipping mining.");
      return;
    }
    this.createBlock(this.miningQueue, this.chain[this.chain.length - 1].hash);
    this.miningQueue = [];
  }

  addTransactionToMiningQueue(transaction) {
    this.miningQueue.push(transaction);
  }
}

module.exports = Blockchain;
