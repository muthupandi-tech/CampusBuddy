const express = require('express');
const http = require('http');
const path = require('path');
const { Server } = require('socket.io');
const cors = require('cors');
const dotenv = require('dotenv');
const db = require('./config/db');
const { createNotification } = require('./controllers/notificationController');


dotenv.config();

const app = express();
const server = http.createServer(app);

// Configuring CORS
const corsOptions = {
  origin: process.env.FRONTEND_URL || '*', 
  methods: ['GET', 'POST', 'PUT', 'DELETE'],
  credentials: true
};
app.use(cors(corsOptions));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Routes
const fileUpload = require('express-fileupload');

app.use(fileUpload({
    createParentPath: true,
    limits: { fileSize: 50 * 1024 * 1024 },
    abortOnLimit: true,
    responseOnLimit: 'File size limit has been reached'
}));

app.use('/api/auth', require('./routes/authRoutes'));
app.use('/api/users', require('./routes/userRoutes'));
app.use('/api/messages', require('./routes/messageRoutes'));
app.use('/api/academic', require('./routes/academicRoutes'));
app.use('/api/feedback', require('./routes/feedbackRoutes'));
app.use('/api/notifications', require('./routes/notificationRoutes'));
app.use('/api/analytics', require('./routes/analyticsRoutes'));
app.use('/api/chatbot', require('./routes/chatbotRoutes'));
app.use('/api/admin', require('./routes/adminRoutes'));
app.use('/api/classrooms', require('./routes/classroomRoutes'));
app.use('/api/students', require('./routes/classroomRoutes'));
app.use('/api/dm', require('./routes/dmRoutes')); // For direct student listing API
app.use('/api/myclass', require('./routes/myClassRoutes'));

app.use('/uploads', express.static(path.join(__dirname, 'uploads'), {
  setHeaders: (res, path) => {
    res.set('Content-Disposition', 'inline');
  }
}));

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

      // Create a persistent notification for the receiver
      const senderNameQuery = await db.query('SELECT name FROM users WHERE id = $1', [sender_id]);
      const senderName = senderNameQuery.rows[0]?.name || 'Someone';
      await createNotification(receiver_id, `New message from ${senderName}: "${message.substring(0, 30)}${message.length > 30 ? '...' : ''}"`, 'message');
      
      // Emit to receiver if online (using already defined receiverSocketId)
      if (receiverSocketId) {
        io.to(receiverSocketId).emit('notification_new', { type: 'message' });
      }

    } catch (error) {
      console.error('Error saving message via socket:', error);
    }
  });

  // --- Classroom Socket Events ---
  socket.on('join_classroom', (classroomId) => {
    socket.join(`classroom_${classroomId}`);
    console.log(`Socket ${socket.id} joined classroom_${classroomId}`);
  });

  socket.on('leave_classroom', (classroomId) => {
    socket.leave(`classroom_${classroomId}`);
    console.log(`Socket ${socket.id} left classroom_${classroomId}`);
  });

  socket.on('classroom_message', async (data) => {
    const { classroom_id, sender_id, message } = data;
    try {
      // BLOCK CHECK: Is sender blocked by staff in this classroom?
      const blockCheck = await db.query(
        'SELECT id FROM classroom_blocks WHERE classroom_id = $1 AND blocked_user_id = $2',
        [classroom_id, sender_id]
      );
      if (blockCheck.rows.length > 0) {
        return socket.emit('error', 'You are restricted from messaging by staff');
      }

      // Save it to database
      const newMsg = await db.query(
        `INSERT INTO classroom_messages (classroom_id, sender_id, message) 
         VALUES ($1, $2, $3) RETURNING *`,
        [classroom_id, sender_id, message]
      );
      
      const senderData = await db.query(
        `SELECT u.name, u.avatar_url, cm.role 
         FROM users u 
         LEFT JOIN classroom_members cm ON u.id = cm.user_id AND cm.classroom_id = $2 
         WHERE u.id = $1`, 
        [sender_id, classroom_id]
      );
      
      const messageData = {
        ...newMsg.rows[0],
        sender_name: senderData.rows[0]?.name,
        avatar_url: senderData.rows[0]?.avatar_url,
        role: senderData.rows[0]?.role
      };

      // Broadcast to all users in this classroom room
      io.to(`classroom_${classroom_id}`).emit('receive_classroom_message', messageData);

      // NOTIFICATION: Notify all students if staff messages
      if (messageData.role === 'staff') {
        const studentsQuery = await db.query(
          'SELECT user_id FROM classroom_members WHERE classroom_id = $1 AND role = \'student\'',
          [classroom_id]
        );
        
        for (const student of studentsQuery.rows) {
          await createNotification(
            student.user_id,
            `Faculty ${messageData.sender_name} posted in classroom: "${message.substring(0, 30)}${message.length > 30 ? '...' : ''}"`,
            'classroom'
          );
          
          // Emit socket if online
          const studentSocketId = connectedUsers.get(student.user_id);
          if (studentSocketId) {
            io.to(studentSocketId).emit('notification_new', { type: 'classroom' });
          }
        }
      }
    } catch (error) {
      console.error('Error saving classroom message:', error);
    }
  });

  socket.on('dm_send', async (data) => {
    const { sender_id, receiver_id, message, file_url } = data;
    try {
      const senderData = await db.query('SELECT name, avatar_url FROM users WHERE id = $1', [sender_id]);
      const messageData = {
        sender_id,
        receiver_id,
        message,
        file_url,
        sender_name: senderData.rows[0]?.name,
        avatar_url: senderData.rows[0]?.avatar_url,
        created_at: new Date()
      };

      // Emit to receiver
      const receiverSocketId = connectedUsers.get(receiver_id);
      if (receiverSocketId) {
        io.to(receiverSocketId).emit('dm_receive', messageData);
      }
      
      // Also emit back to sender to confirm (or UI handles it)
      socket.emit('dm_receive', messageData);
    } catch (err) {
      console.error('DM socket error:', err);
    }
  });

  // --- Section Chat Socket Events ---
  socket.on('join_section', (sectionId) => {
    socket.join(`section_${sectionId}`);
    console.log(`Socket ${socket.id} joined section_${sectionId}`);
  });

  socket.on('section_message', async (data) => {
    const { section_id, sender_id, message } = data;
    try {
      const newMsg = await db.query(
        `INSERT INTO section_messages (section_id, sender_id, message) 
         VALUES ($1, $2, $3) RETURNING *`,
        [section_id, sender_id, message]
      );
      
      const senderData = await db.query('SELECT name, avatar_url, role FROM users WHERE id = $1', [sender_id]);
      const messageData = {
        ...newMsg.rows[0],
        sender_name: senderData.rows[0].name,
        avatar_url: senderData.rows[0].avatar_url,
        sender_role: senderData.rows[0].role
      };

      io.to(`section_${section_id}`).emit('receive_section_message', messageData);

      // NOTIFICATION: Notify all students in the section if staff messages
      if (messageData.sender_role === 'staff') {
        const studentsQuery = await db.query(
          'SELECT id FROM users WHERE section_id = $1 AND role = \'student\'',
          [section_id]
        );

        for (const student of studentsQuery.rows) {
          await createNotification(
            student.id,
            `Class teacher ${messageData.sender_name} sent a message to the section: "${message.substring(0, 30)}${message.length > 30 ? '...' : ''}"`,
            'section'
          );

          // Emit socket if online
          const studentSocketId = connectedUsers.get(student.id);
          if (studentSocketId) {
            io.to(studentSocketId).emit('notification_new', { type: 'section' });
          }
        }
      }
    } catch (error) {
      console.error('Section message error:', error);
    }
  });
  // -------------------------------

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

app.get('/api/health', (req, res) => {
  res.status(200).json({ status: 'ok' });
});

// Global Error Handler
app.use((err, req, res, next) => {
  console.error('Global Error Handler:', err.message);
  res.status(400).json({ error: err.message || 'An unknown error occurred' });
});

const PORT = process.env.PORT || 5000;
server.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});