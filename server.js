const express = require('express');
const cors = require('cors');
const cookieParser = require('cookie-parser');
const http = require('http');
const socketIo = require('socket.io');
require('dotenv').config();

const app = express();

// CORS configuration
const corsOptions = {
  origin: 'https://lexora-taupe.vercel.app', // Frontend origin
  methods: ['GET', 'POST', 'PATCH', 'DELETE', 'OPTIONS'], // Allowed methods
  credentials: true, // Allow cookies and headers for auth
  preflightContinue: false, // End preflight requests at the CORS middleware
  optionsSuccessStatus: 200, // For legacy browsers
};

// Middleware setup
app.use(cors(corsOptions)); // Enable CORS middleware
app.use(cookieParser());
app.use(express.json());

// Route imports
const authRoutes = require('./routes/authRoutes');
const userRoutes = require('./routes/userRoutes');
const chatRoutes = require('./routes/chatRoutes');

// HTTP server and Socket.IO setup
const server = http.createServer(app);
const io = socketIo(server, {
  cors: {
    origin: 'https://lexora-taupe.vercel.app',
    methods: ['GET', 'POST'],
    credentials: true,
  }
});

// Make socket.io available globally
app.set('socketio', io);

// API Routes
app.use('/api/auth', authRoutes);
app.use('/api/user', userRoutes);
app.use('/api/chat', chatRoutes(io)); // Pass `io` to chat routes

// Fallback route for handling unmatched routes
app.get('*', (_, res) => {
  res.sendFile(`${__dirname}/public/download.png`);
});

// Error handler for all routes
app.use((err, _, res, __) => {
  console.error(err.stack);
  res.status(err.status || 500).json({ error: err.message || 'Server Error' });
});

// Socket.IO connection
io.on('connection', (socket) => {
  console.log(`New client connected: ${socket.id}`);

  // Logic for rooms and messages
  socket.on('joinRoom', (roomId, senderId, receiverId) => {
    socket.join(roomId);
    console.log(`Client ${senderId} joined room ${roomId} with ${receiverId}`);
  });

  socket.on('chatMessage', ({ senderId, receiverId, message }) => {
    const roomId = [senderId, receiverId].sort().join('-');
    socket.to(roomId).emit('message', { text: message, isSender: false });
    console.log(`Message sent to room ${roomId}: ${message}`);
  });

  socket.on('disconnect', () => {
    console.log(`Client disconnected: ${socket.id}`);
  });
});

// Start the server
const PORT = process.env.PORT || 8000;
server.listen(PORT, () => console.log(`Server running on port ${PORT}`));
