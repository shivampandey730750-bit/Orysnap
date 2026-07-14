import { prisma } from '../config/db.js';
import { uploadToCloudOrLocal } from '../middlewares/uploadMiddleware.js';
import { sendRealtimeNotification } from '../server.js';

// Helper to format post structure to match Mongoose output format
const formatPost = (post) => ({
  _id: post.id,
  user: {
    _id: post.user.id,
    username: post.user.username,
    profilePic: post.user.profilePic,
  },
  mediaUrls: post.mediaUrls,
  caption: post.caption,
  location: post.location,
  hashtags: post.hashtags,
  likes: post.likes.map((l) => l.userId),
  commentsCount: post._count?.comments || 0,
  createdAt: post.createdAt,
  updatedAt: post.updatedAt,
});

// @desc    Create a new post
// @route   POST /api/posts
// @access  Protected
export const createPost = async (req, res) => {
  const { caption, location } = req.body;

  try {
    if (!req.files || req.files.length === 0) {
      return res.status(400).json({ message: 'At least one photo or video is required' });
    }

    const mediaUrls = [];
    for (const file of req.files) {
      const url = await uploadToCloudOrLocal(file);
      if (url) mediaUrls.push(url);
    }

    if (mediaUrls.length === 0) {
      return res.status(500).json({ message: 'File upload failed' });
    }

    const hashtags = [];
    if (caption) {
      const hashRegex = /#(\w+)/g;
      let match;
      while ((match = hashRegex.exec(caption)) !== null) {
        hashtags.push(match[1].toLowerCase());
      }
    }

    const post = await prisma.post.create({
      data: {
        userId: req.user.id,
        mediaUrls,
        caption: caption || '',
        location: location || '',
        hashtags,
      },
      include: {
        user: {
          select: { id: true, username: true, profilePic: true },
        },
        likes: true,
        _count: {
          select: { comments: true },
        },
      },
    });

    res.status(201).json(formatPost(post));
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Get posts for home feed (followed users + own posts)
// @route   GET /api/posts/feed
// @access  Protected
export const getFeedPosts = async (req, res) => {
  const page = parseInt(req.query.page) || 1;
  const limit = parseInt(req.query.limit) || 10;
  const skip = (page - 1) * limit;

  try {
    const followedDocs = await prisma.follow.findMany({
      where: { followerId: req.user.id },
      select: { followingId: true },
    });
    
    const followedIds = followedDocs.map((doc) => doc.followingId);
    followedIds.push(req.user.id); // own posts

    const postsRaw = await prisma.post.findMany({
      where: {
        userId: { in: followedIds },
      },
      include: {
        user: {
          select: { id: true, username: true, profilePic: true },
        },
        likes: true,
        _count: {
          select: { comments: true },
        },
      },
      orderBy: { createdAt: 'desc' },
      skip,
      take: limit,
    });

    res.json(postsRaw.map(formatPost));
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Get posts for explore page (posts from non-followed users)
// @route   GET /api/posts/explore
// @access  Protected
export const getExplorePosts = async (req, res) => {
  const page = parseInt(req.query.page) || 1;
  const limit = parseInt(req.query.limit) || 12;
  const skip = (page - 1) * limit;

  try {
    const followedDocs = await prisma.follow.findMany({
      where: { followerId: req.user.id },
      select: { followingId: true },
    });
    const followedIds = followedDocs.map((doc) => doc.followingId);
    followedIds.push(req.user.id); // exclude own posts

    const postsRaw = await prisma.post.findMany({
      where: {
        userId: { notIn: followedIds },
      },
      include: {
        user: {
          select: { id: true, username: true, profilePic: true },
        },
        likes: true,
        _count: {
          select: { comments: true },
        },
      },
      orderBy: { createdAt: 'desc' },
      skip,
      take: limit,
    });

    res.json(postsRaw.map(formatPost));
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Like a post
// @route   POST /api/posts/:id/like
// @access  Protected
export const likePost = async (req, res) => {
  const { id } = req.params;

  try {
    const post = await prisma.post.findUnique({
      where: { id },
    });

    if (!post) {
      return res.status(404).json({ message: 'Post not found' });
    }

    const alreadyLiked = await prisma.postLike.findUnique({
      where: {
        postId_userId: {
          postId: id,
          userId: req.user.id,
        },
      },
    });

    if (alreadyLiked) {
      return res.status(400).json({ message: 'You already liked this post' });
    }

    await prisma.postLike.create({
      data: {
        postId: id,
        userId: req.user.id,
      },
    });

    // Create notification if the liker is not the post owner
    if (post.userId !== req.user.id) {
      const notification = await prisma.notification.create({
        data: {
          senderId: req.user.id,
          recipientId: post.userId,
          type: 'LIKE',
          postId: post.id,
        },
      });

      sendRealtimeNotification(post.userId, notification.id);
    }

    const updatedLikes = await prisma.postLike.findMany({
      where: { postId: id },
    });

    res.json({ message: 'Post liked', likes: updatedLikes.map((l) => l.userId) });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Unlike a post
// @route   POST /api/posts/:id/unlike
// @access  Protected
export const unlikePost = async (req, res) => {
  const { id } = req.params;

  try {
    const post = await prisma.post.findUnique({
      where: { id },
    });

    if (!post) {
      return res.status(404).json({ message: 'Post not found' });
    }

    const likeRecord = await prisma.postLike.findUnique({
      where: {
        postId_userId: {
          postId: id,
          userId: req.user.id,
        },
      },
    });

    if (!likeRecord) {
      return res.status(400).json({ message: 'You have not liked this post' });
    }

    await prisma.postLike.delete({
      where: {
        postId_userId: {
          postId: id,
          userId: req.user.id,
        },
      },
    });

    // Delete notification
    await prisma.notification.deleteMany({
      where: {
        senderId: req.user.id,
        recipientId: post.userId,
        type: 'LIKE',
        postId: post.id,
      },
    });

    const updatedLikes = await prisma.postLike.findMany({
      where: { postId: id },
    });

    res.json({ message: 'Post unliked', likes: updatedLikes.map((l) => l.userId) });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Get a single post details
// @route   GET /api/posts/:id
// @access  Protected
export const getPostById = async (req, res) => {
  try {
    const post = await prisma.post.findUnique({
      where: { id: req.params.id },
      include: {
        user: {
          select: { id: true, username: true, profilePic: true },
        },
        likes: true,
        _count: {
          select: { comments: true },
        },
      },
    });

    if (!post) {
      return res.status(404).json({ message: 'Post not found' });
    }

    res.json(formatPost(post));
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Delete a post
// @route   DELETE /api/posts/:id
// @access  Protected
export const deletePost = async (req, res) => {
  try {
    const post = await prisma.post.findUnique({
      where: { id: req.params.id },
    });

    if (!post) {
      return res.status(404).json({ message: 'Post not found' });
    }

    if (post.userId !== req.user.id) {
      return res.status(401).json({ message: 'Unauthorized' });
    }

    await prisma.post.delete({
      where: { id: post.id },
    });

    res.json({ message: 'Post deleted successfully' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
