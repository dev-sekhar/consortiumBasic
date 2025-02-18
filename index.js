const readline = require("readline");
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
  };

  blockchain.createGenesisBlock([welcomeTransaction]);

  console.info("Blockchain initialized successfully.");

  rl.question("Enter the first member's name: ", (name) => {
    rl.question("Enter the first member's age: ", (age) => {
      rl.question("Enter the first member's city: ", (city) => {
        rl.question("Enter the first member's business: ", async (business) => {
          const memberType = "first";
          const result = await registerMember(
            blockchain,
            memberType,
            name,
            age,
            city,
            business
          );

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
    });
  });
}

initializeBlockchain();
