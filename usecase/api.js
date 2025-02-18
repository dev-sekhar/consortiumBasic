const express = require("express");
const cors = require("cors"); // Import the CORS middleware
const fs = require("fs");
const { Chaincode } = require("./chaincode");
const Blockchain = require("../core/blockchain");
const {
  registerMember,
  approveTransaction,
  rejectTransaction,
  getApprovedMembers,
  getPendingMembers,
  getRejectedMembers,
} = require("./memberService");
const { mineBlock, getBlockchain, getMiningQueue } = require("./blockService");

function startAPIServer(blockchain) {
  const chaincode = new Chaincode(blockchain); // Initialize chaincode with blockchain

  const app = express();
  app.use(cors()); // Enable CORS
  app.use(express.json());

  // Read member attributes from JSON file
  const memberAttributes = JSON.parse(
    fs.readFileSync("./usecase/data/memberAttributes.json", "utf8")
  ).attributes;

  /**
   * @route POST /transaction
   * @desc Adds a new transaction to the pending transactions pool.
   * @param {string} from - The sender's address.
   * @param {string} to - The recipient's address.
   * @param {number} amount - The amount to transfer.
   * @returns {object} - A success message or an error object.
   * @throws {Error} - If there's an issue adding the transaction.
   */
  app.post("/transaction", async (req, res) => {
    try {
      const { from, to, amount } = req.body;

      if (!from || !to || !amount) {
        return res
          .status(400)
          .json({ error: "Missing required fields (from, to, amount)" });
      }

      const transaction = new Transaction(from, to, amount);

      await chaincode.createTransaction(transaction);

      console.info("Transaction added to pending transactions:", transaction);

      res
        .status(201)
        .json({ message: "Transaction added to pending transactions." });
    } catch (error) {
      console.error("API: Error creating transaction:", error);
      res.status(500).json({ error: "Internal server error" });
    }
  });

  /**
   * @route GET /mine
   * @desc Mines a new block, adding pending transactions to the blockchain.
   * @returns {object} - A success message or an error object.
   * @throws {Error} - If there's an error during mining.
   */
  app.get("/mine", (req, res) => {
    try {
      const result = mineBlock(blockchain);
      res.json(result);
    } catch (error) {
      console.error("Error mining block:", error);
      res.status(500).json({ error: "Internal server error" });
    }
  });

  /**
   * @route GET /chain
   * @desc Retrieves the entire blockchain.
   * @returns {array} - An array of blocks representing the blockchain.
   * @throws {Error} - If there's an error retrieving the blockchain.
   */
  app.get("/chain", (req, res) => {
    try {
      const jsonChain = getBlockchain(chaincode);
      res.json(jsonChain);
    } catch (error) {
      console.error("Error getting chain:", error);
      res.status(500).json({ error: "Internal server error" });
    }
  });

  /**
   * @route GET /pending-transactions
   * @desc Retrieves the list of pending transactions.
   * @returns {array} - An array of pending transactions.
   * @throws {Error} - If there's an error retrieving the pending transactions.
   */
  app.get("/pending-transactions", (req, res) => {
    try {
      const pendingTransactions = blockchain.pendingTransactions;

      console.info("Pending transactions retrieved:", pendingTransactions);

      res.json(pendingTransactions);
    } catch (error) {
      console.error("Error getting pending transactions:", error);
      res.status(500).json({ error: "Internal server error" });
    }
  });

  /**
   * @route POST /member
   * @desc Adds a new member to the blockchain.
   * @param {string} memberType - The type of the member (e.g., "second").
   * @param {string} name - The name of the member.
   * @param {object} attributes - The attributes of the member.
   * @returns {object} - A success message or an error object.
   * @throws {Error} - If there's an issue adding the member.
   */
  app.post("/member", async (req, res) => {
    try {
      const { memberType, name, ...attributes } = req.body;

      if (!memberType || !name) {
        return res
          .status(400)
          .json({ error: "Missing required fields (memberType, name)" });
      }

      // Validate attributes
      const missingAttributes = memberAttributes.filter(
        (attr) => !attributes.hasOwnProperty(attr)
      );
      if (missingAttributes.length > 0) {
        return res
          .status(400)
          .json({
            error: `Missing required attributes: ${missingAttributes.join(
              ", "
            )}`,
          });
      }

      const result = await registerMember(blockchain, memberType, {
        name,
        ...attributes,
      });

      res.status(201).json(result);
    } catch (error) {
      console.error("API: Error creating member:", error);
      res.status(500).json({ error: "Internal server error" });
    }
  });

  /**
   * @route POST /approve-transaction
   * @desc Approves a pending transaction.
   * @param {string} memberName - The name of the member approving the transaction.
   * @param {string} transactionId - The ID of the transaction to approve.
   * @returns {object} - A success message or an error object.
   * @throws {Error} - If there's an issue approving the transaction.
   */
  app.post("/approve-transaction", async (req, res) => {
    try {
      const { memberName, transactionId } = req.body;

      if (!memberName || !transactionId) {
        return res.status(400).json({
          error: "Missing required fields (memberName, transactionId)",
        });
      }

      const result = await approveTransaction(
        blockchain,
        memberName,
        transactionId
      );

      res.status(200).json(result);
    } catch (error) {
      console.error("API: Error approving transaction:", error);
      res.status(500).json({ error: "Internal server error" });
    }
  });

  /**
   * @route POST /reject-transaction
   * @desc Rejects a pending transaction.
   * @param {string} memberName - The name of the member rejecting the transaction.
   * @param {string} transactionId - The ID of the transaction to reject.
   * @param {string} reason - The reason for rejecting the transaction.
   * @returns {object} - A success message or an error object.
   * @throws {Error} - If there's an issue rejecting the transaction.
   */
  app.post("/reject-transaction", async (req, res) => {
    try {
      const { memberName, transactionId, reason } = req.body;

      if (!memberName || !transactionId || !reason) {
        return res.status(400).json({
          error: "Missing required fields (memberName, transactionId, reason)",
        });
      }

      const result = await rejectTransaction(
        blockchain,
        memberName,
        transactionId,
        reason
      );

      res.status(200).json(result);
    } catch (error) {
      console.error("API: Error rejecting transaction:", error);
      res.status(500).json({ error: "Internal server error" });
    }
  });

  /**
   * @route GET /approved-members
   * @desc Retrieves the list of approved members.
   * @returns {array} - An array of approved members.
   * @throws {Error} - If there's an error retrieving the approved members.
   */
  app.get("/approved-members", (req, res) => {
    try {
      const approvedMembers = getApprovedMembers(blockchain);

      res.json(approvedMembers);
    } catch (error) {
      console.error("Error getting approved members:", error);
      res.status(500).json({ error: "Internal server error" });
    }
  });

  /**
   * @route GET /pending-members
   * @desc Retrieves the list of pending members.
   * @returns {array} - An array of pending members.
   * @throws {Error} - If there's an error retrieving the pending members.
   */
  app.get("/pending-members", (req, res) => {
    try {
      const pendingMembers = getPendingMembers(blockchain);

      res.json(pendingMembers);
    } catch (error) {
      console.error("Error getting pending members:", error);
      res.status(500).json({ error: "Internal server error" });
    }
  });

  /**
   * @route GET /rejected-members
   * @desc Retrieves the list of rejected members.
   * @returns {array} - An array of rejected members.
   * @throws {Error} - If there's an error retrieving the rejected members.
   */
  app.get("/rejected-members", (req, res) => {
    try {
      const rejectedMembers = getRejectedMembers(blockchain);

      res.json(rejectedMembers);
    } catch (error) {
      console.error("Error getting rejected members:", error);
      res.status(500).json({ error: "Internal server error" });
    }
  });

  /**
   * @route GET /mining-queue
   * @desc Retrieves the mining queue.
   * @returns {array} - An array representing the mining queue.
   * @throws {Error} - If there's an error retrieving the mining queue.
   */
  app.get("/mining-queue", (req, res) => {
    try {
      const miningQueue = getMiningQueue(blockchain);
      res.json(miningQueue);
    } catch (error) {
      console.error("Error getting mining queue:", error);
      res.status(500).json({ error: "Internal server error" });
    }
  });

  const PORT = process.env.PORT || 3000;
  app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
  });
}

module.exports = { startAPIServer };
