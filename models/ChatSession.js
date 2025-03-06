const mongoose = require("mongoose");

const ChatSessionSchema = new mongoose.Schema({
  userId: { type: String, required: true }, // Link session to user
  title: { type: String, required: true }, // Chat title (e.g., first user message)
  messages: [
    {
      role: String, // "user" or "bot"
      content: String,
      timestamp: { type: Date, default: Date.now },
    },
  ],
  createdAt: { type: Date, default: Date.now },
});

module.exports = mongoose.model("ChatSession", ChatSessionSchema);
