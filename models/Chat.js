const mongoose = require('mongoose');

const messageSchema = new mongoose.Schema({
  senderLexusId: { type: String, required: true },
  message: { type: String, required: true },
  media: { type: String }, // Optional field for media attachments
  createdAt: { type: Date, default: Date.now },
});

const chatSchema = new mongoose.Schema({
  users: { type: [String], required: true }, // Ensure array length of 2 users
  messages: [messageSchema],
  createdAt: { type: Date, default: Date.now },
});

chatSchema.index({ users: 1 });

module.exports = mongoose.model('Chat', chatSchema);
