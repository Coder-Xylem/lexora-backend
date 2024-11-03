const mongoose = require('mongoose');

const messageSchema = new mongoose.Schema({
  senderLexusId: { type: String, required: true },
  message: { type: String, required: true },
  media: { type: String }, // Optional, for media attachments
  createdAt: { type: Date, default: Date.now }
});

const chatSchema = new mongoose.Schema({
  users: [{ type: String, required: true, index: true }], // Array of lexusIds
  messages: [messageSchema],
  createdAt: { type: Date, default: Date.now }
});

// Compound index for optimized retrieval of user-specific chats
chatSchema.index({ users: 1 });

const Chat = mongoose.model('Chat', chatSchema);
module.exports = Chat;
