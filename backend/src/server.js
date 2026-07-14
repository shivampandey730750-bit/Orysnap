import http from 'http';
import { Server } from 'socket.io';
import dotenv from 'dotenv';
import app from './app.js';
import connectDB, { prisma } from './config/db.js';

dotenv.config();

// Connect to Database (Supabase PostgreSQL via Prisma Client)
connectDB();

const PORT = process.env.PORT || 5000;
const server = http.createServer(app);

// Configure Socket.io
const io = new Server(server, {
  cors: {
    origin: '*',
    methods: ['GET', 'POST', 'PUT', 'DELETE'],
  },
});

// Map of active userId -> set of socketIds
const activeUsers = new Map();

io.on('connection', (socket) => {
  console.log(`Socket connected: ${socket.id}`);

  // User logs in and registers their socket
  socket.on('setup', (userId) => {
    if (!userId) return;
    socket.userId = userId;
    socket.join(userId);
    console.log(`User ${userId} joined room`);
    
    if (!activeUsers.has(userId)) {
      activeUsers.set(userId, new Set());
    }
    activeUsers.get(userId).add(socket.id);
    
    // Broadcast online status
    io.emit('user_online', userId);
  });

  // User typing indicators
  socket.on('typing', ({ chatUserId, room }) => {
    if (room) {
      socket.in(room).emit('typing', room);
    } else if (chatUserId) {
      socket.in(chatUserId).emit('typing', socket.id);
    }
  });

  socket.on('stop_typing', ({ chatUserId, room }) => {
    if (room) {
      socket.in(room).emit('stop_typing', room);
    } else if (chatUserId) {
      socket.in(chatUserId).emit('stop_typing', socket.id);
    }
  });

  // Call signaling
  socket.on('call_user', ({ recipientId, isVideo, callerId, callerName, callerPic }) => {
    socket.to(recipientId).emit('incoming_call', { isVideo, callerId, callerName, callerPic });
    console.log(`Socket: User ${callerId} is calling ${recipientId}`);
  });

  socket.on('accept_call', ({ callerId, recipientId }) => {
    socket.to(callerId).emit('call_accepted', { recipientId });
    console.log(`Socket: User ${recipientId} accepted call from ${callerId}`);
  });

  socket.on('webrtc_signal', ({ targetId, signal }) => {
    socket.to(targetId).emit('webrtc_signal', { signal, senderId: socket.userId || socket.id });
  });

  socket.on('end_call', ({ targetId }) => {
    socket.to(targetId).emit('call_ended');
    console.log(`Socket: Call ended targeting ${targetId}`);
  });

  // User disconnects
  socket.on('disconnect', () => {
    console.log(`Socket disconnected: ${socket.id}`);
    
    for (const [userId, sockets] of activeUsers.entries()) {
      if (sockets.has(socket.id)) {
        sockets.delete(socket.id);
        if (sockets.size === 0) {
          activeUsers.delete(userId);
          io.emit('user_offline', userId);
        }
        break;
      }
    }
  });
});

// Helper: send real-time notification
export const sendRealtimeNotification = async (recipientId, notificationId) => {
  try {
    const notification = await prisma.notification.findUnique({
      where: { id: notificationId },
      include: {
        sender: { select: { id: true, username: true, profilePic: true } },
        post: { select: { id: true, mediaUrls: true, caption: true } },
        comment: { select: { id: true, text: true } },
      },
    });

    if (notification) {
      // Map to frontend MongoDB structure expectations
      const formatted = {
        _id: notification.id,
        sender: {
          _id: notification.sender.id,
          username: notification.sender.username,
          profilePic: notification.sender.profilePic,
        },
        recipient: notification.recipientId,
        type: notification.type,
        post: notification.post ? {
          _id: notification.post.id,
          mediaUrls: notification.post.mediaUrls,
          caption: notification.post.caption,
        } : null,
        comment: notification.comment ? {
          _id: notification.comment.id,
          text: notification.comment.text,
        } : null,
        isRead: notification.isRead,
        createdAt: notification.createdAt,
        updatedAt: notification.updatedAt,
      };

      io.to(recipientId).emit('notification_received', formatted);
    }
  } catch (error) {
    console.error('Error sending real-time notification:', error);
  }
};

// Helper: send real-time message
export const sendRealtimeMessage = (recipientOrRoomId, message, isRoom = false) => {
  if (isRoom) {
    io.to(recipientOrRoomId).emit('message_received', message);
  } else {
    // Emit to both parties
    io.to(recipientOrRoomId).to(message.sender._id.toString()).emit('message_received', message);
  }
};

server.listen(PORT, () => {
  console.log(`Server running in ${process.env.NODE_ENV || 'development'} mode on port ${PORT}`);
});
