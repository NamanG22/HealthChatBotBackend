const mongoose = require('mongoose');

const messageSchema = new mongoose.Schema({
  role: {
    type: String,
    enum: ['user', 'assistant', 'system'],
    required: true
  },
  content: {
    type: String,
    required: true
  },
  timestamp: {
    type: Date,
    default: Date.now
  }
});

const chatSessionSchema = new mongoose.Schema({
  userEmail: {
    type: String,
    required: true
  },
  sessionId: {
    type: String,
    required: true
  },
  messages: [messageSchema],
  isActive: {
    type: Boolean,
    default: true
  },
  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: {
    type: Date,
    default: Date.now
  }
});

// Update the updatedAt timestamp before every save
chatSessionSchema.pre('save', function(next) {
  this.updatedAt = new Date();
  next();
});

// Compound index to ensure unique combination of userEmail and sessionId
chatSessionSchema.index({ userEmail: 1, sessionId: 1 }, { unique: true });

const ChatSession = mongoose.models.ChatSession || mongoose.model('ChatSession', chatSessionSchema);

module.exports = ChatSession;