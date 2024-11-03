const express = require('express');
const http = require('http');
const socketIo = require('socket.io');
const cors = require('cors');
const connectDB = require('./config/db'); 
const cookieParser = require('cookie-parser');
require('dotenv').config();

const app = express();
app.use(cors({ 
  origin: 'https://lexora-taupe.vercel.app/login', 
  credentials: true 
}));
app.use(cookieParser());
app.use(express.json());

connectDB();

app.use((err, req, res, next) => {
  res.status(err.status || 500).json({ error: err.message || 'Server Error' });
});

const authRoutes = require('./routes/authRoutes');
const userRoutes = require('./routes/userRoutes');
const chatRoutes = require('./routes/chatRoutes');


const server = http.createServer(app);
const io = socketIo(server, { cors: { origin: '*' } });
app.set('socketio', io);

io.on('connection', (socket) => {
  console.log('New client connected:', socket.id);
  
  // Listen for user joining a room with consistent room ID format
  socket.on('joinRoom', (roomId,lexusId1,lexusId2) => {
    socket.join(roomId);
    console.log(`Client ${lexusId1} joined room ${roomId} to chat with ${lexusId2}`);
  });

  // Listen for chat messages and emit to other clients in the consistent room
  socket.on('chatMessage', ({ senderId, receiverId, message }) => {
    const sortedRoomId = [senderId, receiverId].sort().join('-'); // Ensure room ID is consistent
    socket.to(sortedRoomId).emit('message', { text: message, isSender: false });
    console.log(`Message sent to room ${sortedRoomId}:`, message);
  });

  socket.on('leaveRoom', (roomId,lexusId) => {
    socket.leave(roomId);
    console.log(`Client ${lexusId} left room ${roomId}`);
  });
  
  socket.on('disconnect', () => {
    console.log('Client disconnected:', socket.id);
  });
});

app.use('/api/auth', authRoutes);
app.use('/api/user', userRoutes);
app.use('/api/chat', chatRoutes(io));

const PORT = process.env.PORT || 8000;
server.listen(PORT, () => console.log(`Server running on port ${PORT}`));
