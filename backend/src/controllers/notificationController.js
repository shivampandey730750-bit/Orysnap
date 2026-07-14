import { prisma } from '../config/db.js';

// Helper to format notification matching frontend structure
const formatNotification = (n) => ({
  _id: n.id,
  sender: {
    _id: n.sender.id,
    username: n.sender.username,
    profilePic: n.sender.profilePic,
  },
  recipient: n.recipientId,
  type: n.type,
  post: n.post ? {
    _id: n.post.id,
    mediaUrls: n.post.mediaUrls,
    caption: n.post.caption,
  } : null,
  comment: n.comment ? {
    _id: n.comment.id,
    text: n.comment.text,
  } : null,
  isRead: n.isRead,
  createdAt: n.createdAt,
  updatedAt: n.updatedAt,
});

// @desc    Get user notifications
// @route   GET /api/notifications
// @access  Protected
export const getNotifications = async (req, res) => {
  try {
    const notifications = await prisma.notification.findMany({
      where: { recipientId: req.user.id },
      include: {
        sender: {
          select: { id: true, username: true, profilePic: true },
        },
        post: {
          select: { id: true, mediaUrls: true, caption: true },
        },
        comment: {
          select: { id: true, text: true },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    res.json(notifications.map(formatNotification));
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Mark a notification as read
// @route   PUT /api/notifications/:id/read
// @access  Protected
export const markNotificationRead = async (req, res) => {
  const { id } = req.params;

  try {
    const notification = await prisma.notification.findFirst({
      where: { id, recipientId: req.user.id },
    });

    if (!notification) {
      return res.status(404).json({ message: 'Notification not found' });
    }

    const updated = await prisma.notification.update({
      where: { id },
      data: { isRead: true },
      include: {
        sender: {
          select: { id: true, username: true, profilePic: true },
        },
        post: {
          select: { id: true, mediaUrls: true, caption: true },
        },
        comment: {
          select: { id: true, text: true },
        },
      },
    });

    res.json(formatNotification(updated));
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Mark all notifications as read
// @route   PUT /api/notifications/read-all
// @access  Protected
export const markAllNotificationsRead = async (req, res) => {
  try {
    await prisma.notification.updateMany({
      where: { recipientId: req.user.id, isRead: false },
      data: { isRead: true },
    });
    res.json({ message: 'All notifications marked as read' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
