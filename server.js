const express = require('express');
const http = require('http');
const socketIo = require('socket.io');
const cors = require('cors');
const connectDB = require('./config/db'); 
const cookieParser = require('cookie-parser');
require('dotenv').config();

const app = express();

// Middleware setup
app.use(cors({ 
  origin: 'https://lexora-taupe.vercel.app',  // Allow all paths from the domain
  credentials: true 
}));
app.use(cookieParser());
app.use(express.json());

// Connect to the database
connectDB();

// Serve static files from the "public" directory
app.use(express.static('public'));

// Route definitions
const authRoutes = require('./routes/authRoutes');
const userRoutes = require('./routes/userRoutes');
const chatRoutes = require('./routes/chatRoutes');

// Create HTTP server and integrate Socket.IO
const server = http.createServer(app);
const io = socketIo(server, { cors: { origin: '*' } });
app.set('socketio', io);  // Make io accessible globally if needed in other routes

// Now that io is defined, use it in chatRoutes
app.use('/api/auth', authRoutes);
app.use('/api/user', userRoutes);
app.use('/api/chat', chatRoutes(io));  // Ensure chatRoutes is a function that returns a router

// Default route to serve "download.png" when no specific route is matched
app.get('*', (req, res) => {
  res.sendFile(__dirname + '/public/download.png');
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error(err.stack);  // Log the error
  res.status(err.status || 500).json({ error: err.message || 'Server Error' });
});

// Socket.IO connection
io.on('connection', (socket) => {
  console.log('New client connected:', socket.id);
  
  socket.on('joinRoom', (roomId, lexusId1, lexusId2) => {
    socket.join(roomId);
    console.log(`Client ${lexusId1} joined room ${roomId} to chat with ${lexusId2}`);
  });

  socket.on('chatMessage', ({ senderId, receiverId, message }) => {
    const sortedRoomId = [senderId, receiverId].sort().join('-'); // Consistent room ID
    socket.to(sortedRoomId).emit('message', { text: message, isSender: false });
    console.log(`Message sent to room ${sortedRoomId}:`, message);
  });

  socket.on('leaveRoom', (roomId, lexusId) => {
    socket.leave(roomId);
    console.log(`Client ${lexusId} left room ${roomId}`);
  });

  socket.on('disconnect', () => {
    console.log('Client disconnected:', socket.id);
  });
});

// Start the server
const PORT = process.env.PORT || 8000;
server.listen(PORT, () => console.log(`Server running on port ${PORT}`));
