const { startAPIServer } = require("./usecase/api");
const Blockchain = require("./core/blockchain");
const { miningInterval } = require("./usecase/parameters");

async function initializeBlockchain() {
  try {
    const blockchain = new Blockchain();

    const welcomeTransaction = {
      from: "0",
      to: "Consensus Network",
      amount: 0,
      message: "Welcome to Consensus Blockchain",
      memberRegistration: null,
    };

    blockchain.chain = [blockchain.createGenesisBlock([welcomeTransaction])];

    console.info("Blockchain initialized successfully.");

    startAPIServer(blockchain); // Pass the blockchain instance to the API server

    // Dynamically import node-fetch
    const fetch = (await import("node-fetch")).default;

    // Register the first member
    const registerResponse = await fetch("http://localhost:3000/member", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        memberType: "first",
        name: "First Member",
        age: "N/A",
        city: "N/A",
        business: "N/A",
      }),
    });
    const registerData = await registerResponse.json();
    console.info("First member registered:", registerData);

    // Approve the first member
    const approveResponse = await fetch(
      "http://localhost:3000/approve-transaction",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          memberName: "System",
          transactionId: registerData.transactionId,
        }),
      }
    );
    const approveData = await approveResponse.json();
    console.info("First member approved:", approveData);

    // Set up periodic mining using the interval from parameters.js
    setInterval(async () => {
      try {
        const mineResponse = await fetch("http://localhost:3000/mine", {
          method: "GET",
        });
        const mineData = await mineResponse.json();
        console.info("Mining result:", mineData);
      } catch (error) {
        console.error("Error during periodic mining:", error);
      }
    }, miningInterval); // Use the mining interval from parameters.js
  } catch (error) {
    console.error("Error initializing blockchain:", error);
  }
}

initializeBlockchain();
