const { v4: uuidv4 } = require("uuid"); // Import UUID library

class Transaction {
  constructor(from, to, amount, message = null, memberRegistration = null) {
    this.transactionId = uuidv4(); // Generate a unique transaction ID
    this.from = from;
    this.to = to;
    this.amount = amount;
    this.timestamp = Date.now();
    this.message = message;
    this.memberRegistration = memberRegistration; // Store member registration data
  }

  toJSON() {
    return {
      transactionId: this.transactionId, // Include transaction ID
      from: this.from,
      to: this.to,
      amount: this.amount,
      timestamp: this.timestamp,
      message: this.message,
      memberRegistration: this.memberRegistration, // Include the member registration
    };
  }
}

module.exports = Transaction;
