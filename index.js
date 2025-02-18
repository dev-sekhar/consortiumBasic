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
    status: "approved", // Set the status to approved
    approvedBy: "System",
    transactionType: "Welcome Transaction",
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
        rl.question(
          `Enter the first member's ${attributes[index]}: `,
          (answer) => {
            answers[attributes[index]] = answer;
            askNext(index + 1);
          }
        );
      } else {
        callback(answers);
      }
    };
    askNext(0);
  };

  rl.question("Enter the first member's name: ", (name) => {
    askQuestions(memberAttributes, async (answers) => {
      const memberType = "first";
      const result = await registerMember(blockchain, memberType, {
        name,
        ...answers,
      });

      console.info("First member registered:", result);

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

      startAPIServer(blockchain, name); // Pass the blockchain instance and first member's name to the API server

      rl.close();
    });
  });
}

initializeBlockchain();
