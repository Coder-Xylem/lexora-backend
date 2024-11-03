const Chat = require('../models/Chat.js');
const emoji = require('node-emoji');
// const Chat = import('../models/Chat.js');
// const emoji = require('node-emoji');
const mongoose = require('mongoose');

// getMessages
exports.getMessages = async (req, res) => {
  const { userId1, userId2 } = req.params;

  try {
    const chat = await Chat.aggregate([
      { $match: { users: { $all: [userId1, userId2] } } },  // Match chats with both users
      { $project: { messages: 1, _id: 0 } } // Only project the messages field
    ]);

    if (chat.length === 0) {
      return res.status(404).json({ error: 'No chat found' });
    }

    res.json({ messages: chat[0].messages });
  } catch (error) {
    console.error('Error in getMessages controller:', error);
    res.status(500).json({ error: 'Failed to retrieve messages' });
  }
};

// sendMessage
exports.sendMessage = async (req, res) => {
  const { senderLexusId, receiverLexusId, message, mediaUrl } = req.body;
  const messageWithEmoji = emoji.emojify(message);

  try {
    // Aggregate to check if chat exists
    const existingChat = await Chat.aggregate([
      { $match: { users: { $all: [senderLexusId, receiverLexusId] } } },
      { $limit: 5 } // Limit to 1 document to just check existence
    ]);

    let chat;
    if (existingChat.length === 0) {
      // Create new chat if it doesn't exist
      console.log("chat sent {chat controller}",chat);
      
      chat = new Chat({
        users: [senderLexusId, receiverLexusId],
        messages: []
      });
    } else {
      // If it exists, retrieve the chat document by its ID
      chat = await Chat.findById(existingChat[0]._id);
    }

    // Add new message to messages array
    chat.messages.push({
      senderLexusId,
      message: messageWithEmoji,
      media: mediaUrl
    });

    await chat.save();

    // Emit the message to the appropriate room
    const io = req.app.get('socketio');
    const roomId = [senderLexusId, receiverLexusId].sort().join('-');
    io.to(roomId).emit('message', { text: messageWithEmoji, sender: senderLexusId });

    res.status(201).json({ chat });
  } catch (error) {
    console.error('Error in sendMessage controller:', error);
    res.status(500).json({ error: 'Failed to send message' });
  }
};
