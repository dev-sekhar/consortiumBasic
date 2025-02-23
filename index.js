const readline = require("readline");
const fs = require("fs");
const { startAPIServer } = require("./usecase/api");
const Blockchain = require("./core/blockchain");
const { registerMember } = require("./usecase/memberService");
const { miningInterval } = require("./usecase/parameters");

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout,
});

async function initializeBlockchain() {
  const blockchain = new Blockchain();

  const welcomeTransaction = {
    from: "0",
    to: "Consensus Network",
    amount: 0,
    message: "Welcome to Consensus Blockchain",
    memberRegistration: null,
    status: "approved",
    approvedBy: "System",
    transactionType: "Genesis Block",
  };

  blockchain.createGenesisBlock([welcomeTransaction]);

  console.info("Blockchain initialized successfully.");

  // Read member attributes from JSON file
  const memberAttributes = JSON.parse(
    fs.readFileSync("./usecase/data/memberAttributes.json", "utf8")
  ).attributes;

  const askQuestions = (attributes, callback) => {
    const answers = {};
    const askNext = (index) => {
      if (index < attributes.length) {
        const attribute = attributes[index];
        rl.question(
          `Enter the first member's ${attribute.name}: `,
          (answer) => {
            answers[attribute.name] = answer;
            askNext(index + 1);
          }
        );
      } else {
        callback(answers);
      }
    };
    askNext(0);
  };

  askQuestions(memberAttributes, async (answers) => {
    console.log("index.js - Answers received:", answers); // Log the answers received

    const memberType = "first";
    console.log("index.js - Registering member with attributes:", answers); // Log the attributes being passed to registerMember
    const result = await registerMember(blockchain, memberType, answers);

    console.info("index.js - First member registered:", result);

    // Mine the first block with the first member registration
    blockchain.minePendingTransactions();

    // Set up periodic mining based on the miningInterval after the first block is mined
    setTimeout(() => {
      setInterval(() => {
        if (blockchain.miningQueue.length > 0) {
          console.info("Triggering automatic mining...");
          blockchain.minePendingTransactions();
        } else {
          const timestamp = new Date().toISOString();
          console.info(
            `No transactions in the mining queue. Skipping mining. [${timestamp}]`
          );
        }
      }, miningInterval);
    }, miningInterval);

    startAPIServer(blockchain, answers.name); // Pass the blockchain instance and first member's name to the API server

    rl.close();
  });
}

initializeBlockchain();
