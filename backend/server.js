const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const cors = require('cors');
const dotenv = require('dotenv');
const db = require('./config/db');

dotenv.config();

const app = express();
const server = http.createServer(app);

// Configuring CORS
const corsOptions = {
  origin: '*', // For MVP phase, allowing all origins. Should restrict to frontend URL in prod.
  methods: ['GET', 'POST', 'PUT', 'DELETE'],
};
app.use(cors(corsOptions));
app.use(express.json());

// Routes
app.use('/api/auth', require('./routes/authRoutes'));
app.use('/api/users', require('./routes/userRoutes'));
app.use('/api/messages', require('./routes/messageRoutes'));

// Basic health check route
app.get('/', (req, res) => {
  res.send('CampusBuddy API is running...');
});

// Socket.io Setup
const io = new Server(server, {
  cors: corsOptions,
});

// Store connected users -> { userId: socketId }
const connectedUsers = new Map();

io.on('connection', (socket) => {
  console.log(`User connected: ${socket.id}`);

  // When a user connects and provides their ID
  socket.on('register', (userId) => {
    connectedUsers.set(userId, socket.id);
    console.log(`User registered: ${userId} with socket: ${socket.id}`);
  });

  // Handle incoming messages
  socket.on('send_message', async (data) => {
    const { sender_id, receiver_id, message } = data;

    try {
      // Save it to database
      const newMsg = await db.query(
        `INSERT INTO messages (sender_id, receiver_id, message) 
         VALUES ($1, $2, $3) RETURNING *`,
        [sender_id, receiver_id, message]
      );

      // Check if receiver is online
      const receiverSocketId = connectedUsers.get(receiver_id);
      if (receiverSocketId) {
        // Send to receiver
        io.to(receiverSocketId).emit('receive_message', newMsg.rows[0]);
      }

      // Send to sender so their chat updates immediately (if needed)
      const senderSocketId = connectedUsers.get(sender_id);
      if (senderSocketId) {
        io.to(senderSocketId).emit('receive_message', newMsg.rows[0]);
      }

    } catch (error) {
      console.error('Error saving message via socket:', error);
    }
  });

  socket.on('disconnect', () => {
    console.log(`User disconnected: ${socket.id}`);
    for (let [userId, socketId] of connectedUsers.entries()) {
      if (socketId === socket.id) {
        connectedUsers.delete(userId);
        break;
      }
    }
  });
});

const PORT = process.env.PORT || 5000;
server.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
