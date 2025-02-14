const express = require("express");
const cors = require("cors"); // Import the CORS middleware
const { Chaincode } = require("./chaincode");
const Blockchain = require("../core/blockchain");
const Transaction = require("../core/transaction");
const { createMember } = require("./createMember");
const TransactionTypes = require("../core/transactionTypes");

function startAPIServer(blockchain) {
  const chaincode = new Chaincode(blockchain); // Initialize chaincode with blockchain

  const app = express();
  app.use(cors()); // Enable CORS
  app.use(express.json());

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
      blockchain.minePendingTransactions();

      console.info("Block mined successfully.");

      res.json({ message: "New block mined." });
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
      const chain = chaincode.getChain();

      const jsonChain = chain.map((block) => block.toJSON());

      console.info("Blockchain retrieved:", jsonChain);

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
   * @param {string} age - The age of the member.
   * @param {string} city - The city of the member.
   * @param {string} business - The business of the member.
   * @returns {object} - A success message or an error object.
   * @throws {Error} - If there's an issue adding the member.
   */
  app.post("/member", async (req, res) => {
    try {
      const { memberType, name, age, city, business } = req.body;

      if (!memberType || !name) {
        return res
          .status(400)
          .json({ error: "Missing required fields (memberType, name)" });
      }

      const memberTransaction = await createMember(memberType, {
        name,
        age,
        city,
        business,
      });

      chaincode.createTransaction(memberTransaction);

      console.info(`${memberType} member registered successfully.`);
      console.info(
        "Current pending transactions:",
        blockchain.pendingTransactions
      );

      res.status(201).json({
        message: `${memberType} member registered successfully.`,
        transactionId: memberTransaction.transactionId,
        status: "pending",
      });
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
          return res.status(403).json({
            error: "Only approved members can approve other members",
          });
        }
      }

      // Find the transaction in the pending transactions
      const transaction = blockchain.pendingTransactions.find(
        (tx) => tx.transactionId === transactionId
      );

      if (!transaction) {
        console.error(
          `Transaction ${transactionId} not found in pending transactions.`
        );
        return res.status(404).json({ error: "Transaction not found" });
      }

      // Ensure the transaction has not already been approved
      if (transaction.approvedBy) {
        return res.status(400).json({
          error: "Transaction has already been approved",
        });
      }

      // Approve the transaction
      transaction.approvedBy = memberName;

      // Move the transaction from pending to the blockchain
      blockchain.pendingTransactions = blockchain.pendingTransactions.filter(
        (tx) => tx.transactionId !== transactionId
      );
      blockchain.createTransaction(transaction);

      console.info(`Transaction ${transactionId} approved by ${memberName}.`);
      console.info(
        "Current blockchain state:",
        JSON.stringify(blockchain.chain, null, 2)
      );

      res.status(200).json({
        message: `Transaction ${transactionId} approved by ${memberName}.`,
        status: "approved",
      });
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
        return res.status(403).json({
          error: "Only approved members can reject other members",
        });
      }

      // Find the transaction in the pending transactions
      const transaction = blockchain.pendingTransactions.find(
        (tx) => tx.transactionId === transactionId
      );

      if (!transaction) {
        console.error(
          `Transaction ${transactionId} not found in pending transactions.`
        );
        return res.status(404).json({ error: "Transaction not found" });
      }

      // Ensure the transaction has not already been approved or rejected
      if (transaction.approvedBy || transaction.rejectedBy) {
        return res.status(400).json({
          error: "Transaction has already been approved or rejected",
        });
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
      console.info(
        "Current blockchain state:",
        JSON.stringify(blockchain.chain, null, 2)
      );

      res.status(200).json({
        message: `Transaction ${transactionId} rejected by ${memberName}.`,
        status: "rejected",
      });
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
      const pendingMembers = blockchain.pendingTransactions
        .filter((transaction) => transaction.memberRegistration)
        .map((transaction) => ({
          name: transaction.memberRegistration.name,
          attributes: transaction.memberRegistration.attributes,
          status: "pending",
        }));

      console.info("Pending members retrieved:", pendingMembers);

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

      res.json(rejectedMembers);
    } catch (error) {
      console.error("Error getting rejected members:", error);
      res.status(500).json({ error: "Internal server error" });
    }
  });

  const PORT = process.env.PORT || 3000;
  app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
  });
}

module.exports = { startAPIServer };
