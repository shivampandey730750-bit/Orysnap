import { prisma } from '../config/db.js';
import { uploadToCloudOrLocal } from '../middlewares/uploadMiddleware.js';
import { sendRealtimeMessage } from '../server.js';

// Helper to format messages
const formatMessage = (msg) => ({
  _id: msg.id,
  sender: {
    _id: msg.sender.id,
    username: msg.sender.username,
    profilePic: msg.sender.profilePic,
  },
  recipient: msg.recipient ? {
    _id: msg.recipient.id,
    username: msg.recipient.username,
    profilePic: msg.recipient.profilePic,
  } : null,
  groupRoom: msg.groupRoom,
  text: msg.text,
  mediaUrl: msg.mediaUrl,
  isRead: msg.isRead,
  createdAt: msg.createdAt,
  updatedAt: msg.updatedAt,
});

// @desc    Send direct message (1:1 or group)
// @route   POST /api/messages
// @access  Protected
export const sendMessage = async (req, res) => {
  const { text, recipientId, groupRoom } = req.body;

  try {
    let mediaUrl = '';
    if (req.file) {
      const url = await uploadToCloudOrLocal(req.file);
      if (url) mediaUrl = url;
    }

    if (!text && !mediaUrl) {
      return res.status(400).json({ message: 'Message content or attachment is required' });
    }

    const data = {
      senderId: req.user.id,
      text: text || '',
      mediaUrl,
    };

    if (groupRoom) {
      data.groupRoom = groupRoom;
    } else if (recipientId) {
      data.recipientId = recipientId;
    } else {
      return res.status(400).json({ message: 'Recipient or group room is required' });
    }

    const message = await prisma.message.create({
      data,
      include: {
        sender: { select: { id: true, username: true, profilePic: true } },
        recipient: { select: { id: true, username: true, profilePic: true } },
      },
    });

    const formatted = formatMessage(message);

    // Emit via Socket.io
    if (groupRoom) {
      sendRealtimeMessage(groupRoom, formatted, true);
    } else {
      sendRealtimeMessage(recipientId, formatted, false);
    }

    res.status(201).json(formatted);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Get conversation between two users
// @route   GET /api/messages/chat/:userId
// @access  Protected
export const getMessagesForUser = async (req, res) => {
  const { userId } = req.params;

  try {
    const messages = await prisma.message.findMany({
      where: {
        OR: [
          { senderId: req.user.id, recipientId: userId },
          { senderId: userId, recipientId: req.user.id },
        ],
      },
      include: {
        sender: { select: { id: true, username: true, profilePic: true } },
        recipient: { select: { id: true, username: true, profilePic: true } },
      },
      orderBy: { createdAt: 'asc' },
    });

    // Mark messages as read
    await prisma.message.updateMany({
      where: {
        senderId: userId,
        recipientId: req.user.id,
        isRead: false,
      },
      data: { isRead: true },
    });

    res.json(messages.map(formatMessage));
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Get chat user list (conversations summary)
// @route   GET /api/messages/conversations
// @access  Protected
export const getChatUsers = async (req, res) => {
  try {
    const messages = await prisma.message.findMany({
      where: {
        OR: [
          { senderId: req.user.id },
          { recipientId: req.user.id },
        ],
      },
      include: {
        sender: { select: { id: true, username: true, profilePic: true } },
        recipient: { select: { id: true, username: true, profilePic: true } },
      },
      orderBy: { createdAt: 'desc' },
    });

    const conversations = {};
    messages.forEach((msg) => {
      const otherUser = msg.senderId === req.user.id ? msg.recipient : msg.sender;
      if (!otherUser) return; // Skip room messages

      const otherUserId = otherUser.id;
      if (!conversations[otherUserId]) {
        conversations[otherUserId] = {
          user: {
            _id: otherUser.id,
            username: otherUser.username,
            profilePic: otherUser.profilePic,
          },
          lastMessage: {
            text: msg.text,
            mediaUrl: msg.mediaUrl,
            sender: msg.senderId,
            isRead: msg.isRead,
            createdAt: msg.createdAt,
          },
        };
      }
    });

    res.json(Object.values(conversations));
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
