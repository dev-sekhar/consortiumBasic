const { createMember } = require("./createMember");

async function registerMember(blockchain, memberType, name, age, city, business) {
  const memberTransaction = await createMember(memberType, {
    name,
    age,
    city,
    business,
  });

  blockchain.createTransaction(memberTransaction);

  console.info(`${memberType} member registered successfully.`);
  console.info("Current pending transactions:", blockchain.pendingTransactions);

  return {
    message: `${memberType} member registered successfully.`,
    transactionId: memberTransaction.transactionId,
    status: "pending",
  };
}

async function approveTransaction(blockchain, memberName, transactionId) {
  // Bypass approval check for the first member
  if (memberName !== "System") {
    // Check if the approving member is approved
    const approvingMember = blockchain.chain
      .flatMap((block) => block.transactions)
      .find(
        (transaction) =>
          transaction.memberRegistration &&
          transaction.memberRegistration.name === memberName &&
          transaction.approvedBy
      );

    if (!approvingMember) {
      throw new Error("Only approved members can approve other members");
    }
  }

  // Find the transaction in the pending transactions
  const transaction = blockchain.pendingTransactions.find(
    (tx) => tx.transactionId === transactionId
  );

  if (!transaction) {
    throw new Error("Transaction not found");
  }

  // Ensure the transaction has not already been approved
  if (transaction.approvedBy) {
    throw new Error("Transaction has already been approved");
  }

  // Approve the transaction
  transaction.approvedBy = memberName;

  // Move the transaction from pending to the blockchain
  blockchain.pendingTransactions = blockchain.pendingTransactions.filter(
    (tx) => tx.transactionId !== transactionId
  );
  blockchain.createTransaction(transaction);

  console.info(`Transaction ${transactionId} approved by ${memberName}.`);
  console.info("Current blockchain state:", JSON.stringify(blockchain.chain, null, 2));

  return {
    message: `Transaction ${transactionId} approved by ${memberName}.`,
    status: "approved",
  };
}

async function rejectTransaction(blockchain, memberName, transactionId, reason) {
  // Check if the rejecting member is approved
  const rejectingMember = blockchain.chain
    .flatMap((block) => block.transactions)
    .find(
      (transaction) =>
        transaction.memberRegistration &&
        transaction.memberRegistration.name === memberName &&
        transaction.approvedBy
    );

  if (!rejectingMember) {
    throw new Error("Only approved members can reject other members");
  }

  // Find the transaction in the pending transactions
  const transaction = blockchain.pendingTransactions.find(
    (tx) => tx.transactionId === transactionId
  );

  if (!transaction) {
    throw new Error("Transaction not found");
  }

  // Ensure the transaction has not already been approved or rejected
  if (transaction.approvedBy || transaction.rejectedBy) {
    throw new Error("Transaction has already been approved or rejected");
  }

  // Reject the transaction
  transaction.rejectedBy = memberName;
  transaction.rejectionReason = reason;

  // Move the transaction from pending to the blockchain
  blockchain.pendingTransactions = blockchain.pendingTransactions.filter(
    (tx) => tx.transactionId !== transactionId
  );
  blockchain.createTransaction(transaction);

  console.info(`Transaction ${transactionId} rejected by ${memberName}.`);
  console.info("Current blockchain state:", JSON.stringify(blockchain.chain, null, 2));

  return {
    message: `Transaction ${transactionId} rejected by ${memberName}.`,
    status: "rejected",
  };
}

function getApprovedMembers(blockchain) {
  const approvedMembers = blockchain.chain
    .flatMap((block) => block.transactions)
    .filter(
      (transaction) =>
        transaction.memberRegistration && transaction.approvedBy
    )
    .map((transaction) => ({
      name: transaction.memberRegistration.name,
      attributes: transaction.memberRegistration.attributes,
      approvedBy: transaction.approvedBy,
      status: "approved",
    }));

  console.info("Approved members retrieved:", approvedMembers);

  return approvedMembers;
}

function getPendingMembers(blockchain) {
  const pendingMembers = blockchain.pendingTransactions
    .filter((transaction) => transaction.memberRegistration)
    .map((transaction) => ({
      name: transaction.memberRegistration.name,
      attributes: transaction.memberRegistration.attributes,
      status: "pending",
    }));

  console.info("Pending members retrieved:", pendingMembers);

  return pendingMembers;
}

function getRejectedMembers(blockchain) {
  const rejectedMembers = blockchain.chain
    .flatMap((block) => block.transactions)
    .filter(
      (transaction) =>
        transaction.memberRegistration && transaction.rejectedBy
    )
    .map((transaction) => ({
      name: transaction.memberRegistration.name,
      attributes: transaction.memberRegistration.attributes,
      rejectedBy: transaction.rejectedBy,
      rejectionReason: transaction.rejectionReason,
      status: "rejected",
    }));

  console.info("Rejected members retrieved:", rejectedMembers);

  return rejectedMembers;
}

module.exports = {
  registerMember,
  approveTransaction,
  rejectTransaction,
  getApprovedMembers,
  getPendingMembers,
  getRejectedMembers,
};