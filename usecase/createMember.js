const { v4: uuidv4 } = require("uuid");
const Transaction = require("../core/transaction");
const TransactionTypes = require("../core/transactionTypes");

async function createMember(memberType, attributes) {
  const transaction = new Transaction(
    "0",
    "Consensus Network",
    0,
    `${TransactionTypes.MEMBER_REGISTRATION}: ${memberType}`,
    {
      name: attributes.name,
      attributes: {
        age: attributes.age,
        city: attributes.city,
        business: attributes.business,
      },
    }
  );

  transaction.transactionId = uuidv4();
  transaction.timestamp = Date.now();

  return transaction;
}

module.exports = { createMember };
