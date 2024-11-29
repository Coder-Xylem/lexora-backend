const express = require('express');
const { sendMessage, getMessages } = require('../controllers/chatController');

module.exports = (io) => {
  const router = express.Router();

  router.post('/send', (req, res) => {
    console.log('Incoming message request:', req.body);
    
    sendMessage(req, res, io);
  });

  router.get('/:userId1/:userId2', (req, res) => {
    console.log('Fetching messages request:', req.params);
    getMessages(req, res);
  });

  return router;
};
