const Block = require("./block");
const Transaction = require("./transaction");

class Blockchain {
  constructor() {
    this.chain = []; // Initialize the chain as an empty array
    this.pendingTransactions = []; // Initialize pending transactions
  }

  createGenesisBlock(transactions) {
    const genesisBlock = new Block(0, Date.now(), transactions, "0");
    genesisBlock.hash = genesisBlock.calculateHash();
    this.chain.push(genesisBlock);
    return genesisBlock;
  }

  getLatestBlock() {
    return this.chain[this.chain.length - 1];
  }

  addBlock(newBlock) {
    newBlock.previousHash = this.getLatestBlock().hash;
    newBlock.hash = newBlock.calculateHash();
    this.chain.push(newBlock);
  }

  isChainValid() {
    for (let i = 1; i < this.chain.length; i++) {
      const currentBlock = this.chain[i];
      const previousBlock = this.chain[i - 1];

      if (currentBlock.hash !== currentBlock.calculateHash()) {
        return false;
      }

      if (currentBlock.previousHash !== previousBlock.hash) {
        return false;
      }
    }
    return true;
  }

  createTransaction(transaction) {
    this.pendingTransactions.push(transaction);
    console.info("Transaction added to pending transactions:", transaction);
  }

  minePendingTransactions() {
    const newBlock = new Block(
      this.chain.length,
      Date.now(),
      this.pendingTransactions,
      this.getLatestBlock().hash
    );
    newBlock.hash = newBlock.calculateHash(); // Calculate hash
    this.addBlock(newBlock);

    this.pendingTransactions = []; // Reset pending transactions
    console.info("Block mined:", newBlock);
  }

  toJSON() {
    return this.chain.map((block) => block.toJSON()); // Correctly serialize blocks
  }
}

module.exports = Blockchain;
