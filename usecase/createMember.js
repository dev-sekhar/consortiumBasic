const { v4: uuidv4 } = require("uuid");
const memberAttributes = require("./data/memberAttributes.json");

async function createMember(memberType, memberDetails) {
  const transactionId = uuidv4();
  const timestamp = Date.now();

  // Directly use the memberDetails attributes
  const attributes = memberDetails.attributes;

  console.log(
    "createMember.js - Attributes being added to the member:",
    attributes
  ); // Log the attributes for debugging

  const memberTransaction = {
    transactionId,
    from: "0",
    to: "Consensus Network",
    amount: 0,
    timestamp,
    message: `Member Registration: ${memberType}`,
    memberRegistration: {
      name: memberDetails.name,
      attributes,
    },
  };

  return memberTransaction;
}

module.exports = { createMember };
