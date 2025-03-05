const mongoose = require("mongoose");

const ChatSessionSchema = new mongoose.Schema({
  userId: String,
  history: [
    {
      role: String,
      content: String,
      timestamp: { type: Date, default: Date.now },
    },
  ],
});

module.exports = mongoose.model("ChatSession", ChatSessionSchema);
