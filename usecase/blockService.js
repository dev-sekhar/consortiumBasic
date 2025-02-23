function mineBlock(blockchain) {
  const approvedTransactions = blockchain.pendingTransactions.filter(
    (transaction) => transaction.approvedBy
  );

  if (approvedTransactions.length === 0) {
    console.info("No approved transactions. No new block created.");
    return { message: "No approved transactions. No new block created." };
  }

  blockchain.pendingTransactions = approvedTransactions;
  blockchain.minePendingTransactions();
  console.info("Block mined successfully.");
  return { message: "New block mined." };
}

function getBlockchain(chaincode) {
  const chain = chaincode.getChain();
  const jsonChain = chain.map((block) => ({
    index: block.index,
    timestamp: block.timestamp,
    transactions: block.transactions.map((tx) => ({
      ...tx,
      status: tx.approvedBy
        ? "approved"
        : tx.rejectedBy
        ? "rejected"
        : "pending",
    })),
    previousHash: block.previousHash,
    hash: block.hash,
  }));
  console.info("Blockchain retrieved:", jsonChain);
  return jsonChain;
}

function getMiningQueue(blockchain) {
  return blockchain.miningQueue.map((transaction) => ({
    ...transaction,
    memberRegistration: {
      ...transaction.memberRegistration,
      attributes: JSON.stringify(
        transaction.memberRegistration.attributes,
        null,
        2
      ),
    },
  }));
}

module.exports = {
  mineBlock,
  getBlockchain,
  getMiningQueue,
};
