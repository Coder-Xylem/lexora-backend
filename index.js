const express = require('express');
const http = require('http');
const socketIo = require('socket.io');
const cors = require('cors');
const connectDB = require('./config/db');
const cookieParser = require('cookie-parser');
require('dotenv').config();

const app = express();

app.use((req, res, next) => {
  const allowedOrigins = [
    'http://localhost:5173',
    'https://xl3llw34-5173.inc1.devtunnels.ms',
    'https://lexora-taupe.vercel.app',

    // Add more URLs as needed
  ];

  const origin = req.headers.origin;

  if (allowedOrigins.includes(origin)) {
    res.header('Access-Control-Allow-Origin', origin); // Allow matching origin
  } else {
    res.header('Access-Control-Allow-Origin', ' '); // You can also deny or wildcard, but restrict it based on your needs
  }

  res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.header('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  res.header('Access-Control-Allow-Credentials', 'true');

  if (req.method === 'OPTIONS') {
    res.sendStatus(200); // Respond to preflight requests
  } else {
    next(); // Pass to the next middleware
  }
});


// Middleware setup
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
const io = socketIo(server, {
  cors: {
    origin: (origin, callback) => {
      const allowedOrigins = [
        'https://lexora-taupe.vercel.app',
        'http://localhost:5173',
        'https://xl3llw34-5173.inc1.devtunnels.ms',
        'https://another-allowed-url.com', // Add other URLs here
      ];

      if (allowedOrigins.indexOf(origin) !== -1 || !origin) {
        callback(null, true); // Allow the connection
      } else {
        callback(new Error('Not allowed by CORS')); // Reject the connection
      }
    },
    methods: ['GET', 'POST', 'PUT', 'DELETE'],
    credentials: true,
  },
  transports: ['websocket', 'polling'], // Support WebSocket and fallback to polling
});

app.set('socketio', io);

// Route configuration
app.use('/api/auth', authRoutes);
app.use('/api/user', userRoutes);
app.use('/api/chat', chatRoutes(io)); // Pass `io` to chatRoutes

// Fallback route to serve a default file for unmatched routes
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
    console.log(`Client joined room: ${roomId}`);
  });

  socket.on('chatMessage', ({ senderId, receiverId, message }) => {
    const roomId = [senderId, receiverId].sort().join('-');
    io.to(roomId).emit('message', {
      senderLexusId: senderId,
      message,
    });
    console.log(`Message sent to room: ${roomId}`);
  });

  socket.on('leaveRoom', ({ roomId }) => {
    socket.leave(roomId);
    console.log(`Client left room: ${roomId}`);
  });

  socket.on('disconnect', () => {
    console.log(`Client disconnected: ${socket.id}`);
  });
});

// Start server
const PORT = process.env.PORT || 8000;
server.listen(PORT, () => console.log(`Server running on port ${PORT}`));