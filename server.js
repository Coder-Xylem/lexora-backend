const express = require('express');
const http = require('http');
const socketIo = require('socket.io');
const cors = require('cors');
const connectDB = require('./config/db');
const cookieParser = require('cookie-parser');
require('dotenv').config();

const app = express();

// Middleware setup
const corsOptions = {
  origin: '*',

  withCredentials: true
};

app.use('/api/auth/register',cors(corsOptions));
app.use(cookieParser());
app.use(express.json());

// Database connection
connectDB();

// Serve static files
app.use(express.static('public'));

// Route imports
const authRoutes = require('./routes/authRoutes');
const userRoutes = require('./routes/userRoutes');
const chatRoutes = require('./routes/chatRoutes');

// HTTP server and Socket.IO setup
const server = http.createServer(app);
const io = socketIo(server, { cors: { origin: '*' } });
app.set('socketio', io); // Make `io` available globally

// Route configuration
app.use('/api/auth', authRoutes);
app.use('/api/user', userRoutes);
app.use('/api/chat', chatRoutes(io)); // Pass `io` to chatRoutes

// Fallback route to serve a default file
app.get('*', (_, res) => {
  res.sendFile(`${__dirname}/public/download.png`);
});

// Global error handler
app.use((err, _, res, __) => {
  console.error(err.stack);
  res.status(err.status || 500).json({ error: err.message || 'Server Error' });
});

// Socket.IO connection logic
io.on('connection', (socket) => {
  console.log(`New client connected: ${socket.id}`);

  socket.on('joinRoom', ({ roomId }) => {
    socket.join(roomId);
    console.log(`Client joined room ${roomId}`);
});

socket.on('chatMessage', ({ senderId, receiverId, message }) => {
    const roomId = [senderId, receiverId].sort().join('-');
    io.to(roomId).emit('message', {
      senderLexusId: senderId,
      message,
    });
    console.log(`Message sent to room ${roomId}`);
});

socket.on('leaveRoom', ({ roomId }) => {
    socket.leave(roomId);
    console.log(`Client left room ${roomId}`);
});

});

// Start server
const PORT = process.env.PORT || 8000;
server.listen(PORT, () => console.log(`Server running on port ${PORT}`));
