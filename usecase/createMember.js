const { v4: uuidv4 } = require("uuid");
const memberAttributes = require("./data/memberAttributes.json");

async function createMember(memberType, memberDetails) {
  const transactionId = uuidv4();
  const timestamp = Date.now();

  // Include the attributes from memberAttributes.json
  const attributes = memberAttributes.attributes.reduce((acc, attr) => {
    acc[attr] = memberDetails[attr] || "";
    return acc;
  }, {});

  console.log("Attributes being added to the member:", attributes); // Log the attributes for debugging

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
