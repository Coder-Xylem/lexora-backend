const express = require('express');
const cors = require('cors');
const cookieParser = require('cookie-parser');
const http = require('http');
const socketIo = require('socket.io');
require('dotenv').config();

const app = express();

// Define allowed origins and methods for CORS
const allowedOrigins = ['https://lexora-taupe.vercel.app'];
const corsOptions = {
  origin: (origin, callback) => {
    if (!origin || allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      callback(new Error('Not allowed by CORS'));
    }
  },
  methods: ['GET', 'POST', 'PATCH', 'DELETE', 'OPTIONS'],
  credentials: true,
  preflightContinue: false,
  optionsSuccessStatus: 200,
};

// Middleware setup
app.use(cookieParser());
app.use(express.json());

// Apply CORS only for specific routes
app.use('/api/auth/login', cors(corsOptions));
app.use('/api/auth/register', cors(corsOptions));
app.use('/api/user', cors(corsOptions));
app.use('/api/chat', cors(corsOptions));

// HTTP server and Socket.IO setup
const server = http.createServer(app);
const io = socketIo(server, {
  cors: {
    origin: 'https://lexora-taupe.vercel.app',
    methods: ['GET', 'POST'],
    credentials: true,
  },
});

// Make socket.io available globally
app.set('socketio', io);

// API Routes
const authRoutes = require('./routes/authRoutes');
const userRoutes = require('./routes/userRoutes');
const chatRoutes = require('./routes/chatRoutes');

// Route imports
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
