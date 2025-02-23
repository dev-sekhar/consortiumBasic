const { createMember } = require("./createMember");
const TransactionTypes = require("../core/transactionTypes");
const path = require("path");
const fs = require("fs");

// Read member attributes from JSON file
const memberAttributes = JSON.parse(
  fs.readFileSync(
    path.join(__dirname, "../usecase/data/memberAttributes.json"),
    "utf8"
  )
);

async function registerMember(blockchain, memberType, memberDetails) {
  console.log("memberService.js - Member details received:", memberDetails); // Log the member details received

  // Include the attributes from memberAttributes.json
  const attributes = memberAttributes.attributes.reduce((acc, attr) => {
    acc[attr.name] = memberDetails[attr.name] || "";
    return acc;
  }, {});

  console.log("memberService.js - Processed attributes:", attributes); // Log the processed attributes

  const memberTransaction = await createMember(memberType, {
    name: memberDetails.name,
    attributes,
  });

  console.log(
    "memberService.js - Attributes being added to the member:",
    JSON.stringify(memberTransaction.memberRegistration.attributes, null, 2)
  ); // Log the attributes being added to the member

  // Add transactionType to the transaction
  memberTransaction.transactionType = TransactionTypes.MEMBER_REGISTRATION;

  // Check if there are any approved members
  const approvedMembers = blockchain.chain
    .flatMap((block) => block.transactions)
    .filter(
      (transaction) => transaction.memberRegistration && transaction.approvedBy
    );

  // Automatically approve the first member
  if (approvedMembers.length === 0) {
    memberTransaction.approvedBy = "System";
    blockchain.addTransactionToMiningQueue(memberTransaction);
    blockchain.minePendingTransactions();
    console.info("First member automatically approved.");
  } else {
    blockchain.pendingTransactions.push(memberTransaction);
  }

  console.info("memberService.js - Member registered successfully.");
  console.info(
    "memberService.js - Current pending transactions:",
    JSON.stringify(blockchain.pendingTransactions, null, 2)
  );

  return {
    message: `${memberType} member registered successfully.`,
    transactionId: memberTransaction.transactionId,
    status: memberTransaction.approvedBy ? "approved" : "pending",
  };
}

async function approveTransaction(blockchain, memberName, transactionId) {
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
  transaction.transactionType = TransactionTypes.MEMBER_APPROVAL;

  // Move the transaction from pending to the mining queue
  blockchain.pendingTransactions = blockchain.pendingTransactions.filter(
    (tx) => tx.transactionId !== transactionId
  );
  blockchain.addTransactionToMiningQueue(transaction);

  console.info(`Transaction ${transactionId} approved by ${memberName}.`);
  console.info(
    "Current blockchain state:",
    JSON.stringify(blockchain.chain, null, 2)
  );

  return {
    message: `Transaction ${transactionId} approved by ${memberName}.`,
    status: "approved",
  };
}

async function rejectTransaction(
  blockchain,
  memberName,
  transactionId,
  reason
) {
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
  transaction.transactionType = TransactionTypes.MEMBER_REJECTION;

  // Move the transaction from pending to the mining queue
  blockchain.pendingTransactions = blockchain.pendingTransactions.filter(
    (tx) => tx.transactionId !== transactionId
  );
  blockchain.addTransactionToMiningQueue(transaction);

  console.info(`Transaction ${transactionId} rejected by ${memberName}.`);
  console.info(
    "Current blockchain state:",
    JSON.stringify(blockchain.chain, null, 2)
  );

  return {
    message: `Transaction ${transactionId} rejected by ${memberName}.`,
    status: "rejected",
  };
}

function getApprovedMembers(blockchain) {
  const approvedMembers = blockchain.chain
    .flatMap((block) => block.transactions)
    .filter(
      (transaction) => transaction.memberRegistration && transaction.approvedBy
    )
    .map((transaction) => ({
      name: transaction.memberRegistration.name,
      attributes: transaction.memberRegistration.attributes,
      approvedBy: transaction.approvedBy,
      status: "approved",
    }));

  console.info(
    "Approved members retrieved:",
    JSON.stringify(approvedMembers, null, 2)
  ); // Log the approved members

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

  console.info(
    "Pending members retrieved:",
    JSON.stringify(pendingMembers, null, 2)
  );

  return pendingMembers;
}

function getRejectedMembers(blockchain) {
  const rejectedMembers = blockchain.chain
    .flatMap((block) => block.transactions)
    .filter(
      (transaction) => transaction.memberRegistration && transaction.rejectedBy
    )
    .map((transaction) => ({
      name: transaction.memberRegistration.name,
      attributes: transaction.memberRegistration.attributes,
      rejectedBy: transaction.rejectedBy,
      rejectionReason: transaction.rejectionReason,
      status: "rejected",
    }));

  console.info(
    "Rejected members retrieved:",
    JSON.stringify(rejectedMembers, null, 2)
  );

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
