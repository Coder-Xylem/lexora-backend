const Chat = require('../models/Chat.js');
const emoji = require('node-emoji');
const mongoose = require('mongoose');

// **Get Messages Controller**
exports.getMessages = async (req, res) => {
  const { userId1, userId2 } = req.params;

  try {
    const chat = await Chat.aggregate([
      { $match: { users: { $all: [userId1, userId2] } } },  // Match chats with both users
      { $project: { messages: 1, _id: 0 } } // Project only the messages field
    ]);

    if (!chat || chat.length === 0) {
      return res.status(404).json({ error: 'No chat found between the users.' });
    }

    res.json({ messages: chat[0].messages });
  } catch (error) {
    console.error('Error in getMessages controller:', error);
    res.status(500).json({ error: 'Failed to retrieve messages' });
  }
};

// **Send Message Controller**
exports.sendMessage = async (req, res) => {
  const { senderId, receiverId, message, mediaUrl } = req.body;
  // console.log("req.body:", req.body);
  let senderLexusId = senderId
  let receiverLexusId = receiverId 
  if (!senderLexusId || !receiverLexusId || !message) {
    return res.status(400).json({ error: 'Sender ID, Receiver ID, and Message are required.' });
  }

  try {
    const messageWithEmoji = emoji.emojify(message);

    // Check if the chat already exists between the users
    const existingChat = await Chat.findOne({ users: { $all: [senderLexusId, receiverLexusId] } });

    let chat;
    if (!existingChat) {
      // Create a new chat if it doesn't exist
      chat = new Chat({
        users: [senderLexusId, receiverLexusId],
        messages: [],
      });
    } else {
      // Retrieve the existing chat document
      chat = existingChat;
    }

    // Add the new message to the chat
    chat.messages.push({
      senderLexusId,
      message: messageWithEmoji,
      media: mediaUrl || null, // Null if no media URL is provided
    });

    await chat.save();

    // Emit the message to the corresponding room
    const io = req.app.get('socketio');
    const roomId = [senderLexusId, receiverLexusId].sort().join('-');
    io.to(roomId).emit('message', { text: messageWithEmoji, sender: senderLexusId });

    res.status(201).json({ message: 'Message sent successfully', chat });
  } catch (error) {
    console.error('Error in sendMessage controller:', error);
    res.status(500).json({ error: 'Failed to send message' });
  }
};
