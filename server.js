const express = require('express');
const http = require('http');
const socketIo = require('socket.io');
const cors = require('cors');
const connectDB = require('./config/db');
const cookieParser = require('cookie-parser');
require('dotenv').config();

const app = express();

// CORS configuration
const corsOptions = {
  origin: ['https://lexora-taupe.vercel.app'], // Allowed frontend origins
  methods: ['GET', 'POST', 'PATCH', 'DELETE', 'OPTIONS'], // Allowed methods, including OPTIONS for preflight
  credentials: true // Allow cookies and authentication headers
};

app.use(cors(corsOptions));  // Use CORS middleware
app.use(cookieParser());     // Parse cookies
app.use(express.json());     // Parse incoming JSON requests

// Database connection
connectDB();

// Serve static files (if any)
app.use(express.static('public'));

// Route imports
const authRoutes = require('./routes/authRoutes');
const userRoutes = require('./routes/userRoutes');
const chatRoutes = require('./routes/chatRoutes');

// HTTP server and Socket.IO setup
const server = http.createServer(app);
const io = socketIo(server, {
  cors: {
    origin: ['https://lexora-taupe.vercel.app'], // Match frontend origin
    methods: ['GET', 'POST'], // Match allowed methods for Socket.IO
    credentials: true // Allow credentials if needed (cookies or headers)
  }
});
app.set('socketio', io); // Make `io` available globally

// Enable preflight for all routes
app.options('*', cors(corsOptions)); // Handle preflight OPTIONS request

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

  // Join room (sender and receiver)
  socket.on('joinRoom', (roomId, senderId, receiverId) => {
    socket.join(roomId);
    console.log(`Client ${senderId} joined room ${roomId} with ${receiverId}`);
  });

  // Send a chat message
  socket.on('chatMessage', ({ senderId, receiverId, message }) => {
    const roomId = [senderId, receiverId].sort().join('-'); // Ensure consistent room ID
    socket.to(roomId).emit('message', { text: message, isSender: false });
    console.log(`Message sent to room ${roomId}: ${message}`);
  });

  // Leave room (if user disconnects or leaves)
  socket.on('leaveRoom', (roomId, clientId) => {
    socket.leave(roomId);
    console.log(`Client ${clientId} left room ${roomId}`);
  });

  // Handle client disconnect
  socket.on('disconnect', () => {
    console.log(`Client disconnected: ${socket.id}`);
  });
});

// Start server
const PORT = process.env.PORT || 8000;
server.listen(PORT, () => console.log(`Server running on port ${PORT}`));
