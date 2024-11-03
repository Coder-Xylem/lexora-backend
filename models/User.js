const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
  lexusId: { type: String, unique: true, required: true },
  password: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  friends: [{ type: String }],  // Storing friends as an array of lexusId strings
  isAvailable: { type: Boolean, default: true },
});

module.exports = mongoose.model('User', userSchema);
