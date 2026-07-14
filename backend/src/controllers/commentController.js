import { prisma } from '../config/db.js';
import { sendRealtimeNotification } from '../server.js';

// Helper to format comment to match frontend structure
const formatComment = (c) => ({
  _id: c.id,
  user: {
    _id: c.user.id,
    username: c.user.username,
    profilePic: c.user.profilePic,
  },
  post: c.postId,
  text: c.text,
  likes: c.likes?.map((l) => l.userId) || [],
  parentComment: c.parentCommentId,
  createdAt: c.createdAt,
  updatedAt: c.updatedAt,
  replies: c.replies?.map((r) => ({
    _id: r.id,
    user: {
      _id: r.user.id,
      username: r.user.username,
      profilePic: r.user.profilePic,
    },
    post: r.postId,
    text: r.text,
    likes: r.likes?.map((l) => l.userId) || [],
    parentComment: r.parentCommentId,
    createdAt: r.createdAt,
    updatedAt: r.updatedAt,
  })) || [],
});

// @desc    Add comment/reply to a post
// @route   POST /api/comments
// @access  Protected
export const createComment = async (req, res) => {
  const { postId, text, parentCommentId } = req.body;

  try {
    const post = await prisma.post.findUnique({
      where: { id: postId },
    });

    if (!post) {
      return res.status(404).json({ message: 'Post not found' });
    }

    const comment = await prisma.comment.create({
      data: {
        userId: req.user.id,
        postId,
        text,
        parentCommentId: parentCommentId || null,
      },
      include: {
        user: {
          select: { id: true, username: true, profilePic: true },
        },
      },
    });

    // Notify post owner
    if (post.userId !== req.user.id) {
      const notification = await prisma.notification.create({
        data: {
          senderId: req.user.id,
          recipientId: post.userId,
          type: 'COMMENT',
          postId: post.id,
          commentId: comment.id,
        },
      });

      sendRealtimeNotification(post.userId, notification.id);
    }

    // Notify parent comment owner if nested reply
    if (parentCommentId) {
      const parentComment = await prisma.comment.findUnique({
        where: { id: parentCommentId },
      });

      if (parentComment && parentComment.userId !== req.user.id) {
        const replyNotification = await prisma.notification.create({
          data: {
            senderId: req.user.id,
            recipientId: parentComment.userId,
            type: 'COMMENT',
            postId: post.id,
            commentId: comment.id,
          },
        });

        sendRealtimeNotification(parentComment.userId, replyNotification.id);
      }
    }

    res.status(201).json(formatComment(comment));
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Get comments for a post
// @route   GET /api/comments/post/:postId
// @access  Protected
export const getPostComments = async (req, res) => {
  const { postId } = req.params;

  try {
    const commentsRaw = await prisma.comment.findMany({
      where: {
        postId,
        parentCommentId: null,
      },
      include: {
        user: {
          select: { id: true, username: true, profilePic: true },
        },
        likes: true,
        replies: {
          include: {
            user: {
              select: { id: true, username: true, profilePic: true },
            },
            likes: true,
          },
          orderBy: { createdAt: 'asc' },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    res.json(commentsRaw.map(formatComment));
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Like a comment
// @route   POST /api/comments/:id/like
// @access  Protected
export const likeComment = async (req, res) => {
  const { id } = req.params;

  try {
    const comment = await prisma.comment.findUnique({
      where: { id },
    });

    if (!comment) {
      return res.status(404).json({ message: 'Comment not found' });
    }

    const alreadyLiked = await prisma.commentLike.findUnique({
      where: {
        commentId_userId: {
          commentId: id,
          userId: req.user.id,
        },
      },
    });

    if (alreadyLiked) {
      return res.status(400).json({ message: 'You already liked this comment' });
    }

    await prisma.commentLike.create({
      data: {
        commentId: id,
        userId: req.user.id,
      },
    });

    const updatedLikes = await prisma.commentLike.findMany({
      where: { commentId: id },
    });

    res.json({ message: 'Comment liked', likes: updatedLikes.map((l) => l.userId) });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Unlike a comment
// @route   POST /api/comments/:id/unlike
// @access  Protected
export const unlikeComment = async (req, res) => {
  const { id } = req.params;

  try {
    const comment = await prisma.comment.findUnique({
      where: { id },
    });

    if (!comment) {
      return res.status(404).json({ message: 'Comment not found' });
    }

    const likeRecord = await prisma.commentLike.findUnique({
      where: {
        commentId_userId: {
          commentId: id,
          userId: req.user.id,
        },
      },
    });

    if (!likeRecord) {
      return res.status(400).json({ message: 'You have not liked this comment' });
    }

    await prisma.commentLike.delete({
      where: {
        commentId_userId: {
          commentId: id,
          userId: req.user.id,
        },
      },
    });

    const updatedLikes = await prisma.commentLike.findMany({
      where: { commentId: id },
    });

    res.json({ message: 'Comment unliked', likes: updatedLikes.map((l) => l.userId) });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
