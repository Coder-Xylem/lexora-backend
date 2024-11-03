const express = require('express');
const { sendMessage, getMessages } = require('../controllers/chatController');
// const { verifyJWT } = require('../utils/authMiddleware');

module.exports = (io) => {
  const router = express.Router();

  // Pass `io` for socket functionality
//   router.post('/send',verifyJWT)
  router.post('/send', (req, res) =>{ 
    
    console.log("request ayi from chat route", req.body);
    sendMessage(req, res, io);})


  router.get('/:userId1/:userId2', (req, res) =>{ 
    
    console.log("request ayi from chat route", req.body);
    getMessages(req, res, io);})



  // router.get('/:userId1/:userId2', getMessages);

  return router;
};
