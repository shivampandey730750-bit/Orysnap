import { prisma } from '../config/db.js';
import { uploadToCloudOrLocal } from '../middlewares/uploadMiddleware.js';

// @desc    Upload a new story (24-hour disappearing status)
// @route   POST /api/stories
// @access  Protected
export const createStory = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ message: 'Story media file is required' });
    }

    const mediaUrl = await uploadToCloudOrLocal(req.file);
    if (!mediaUrl) {
      return res.status(500).json({ message: 'Media upload failed' });
    }

    const isVideo = req.file.mimetype.startsWith('video');
    const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24h from now

    const story = await prisma.story.create({
      data: {
        userId: req.user.id,
        mediaUrl,
        isVideo,
        expiresAt,
      },
      include: {
        user: {
          select: { id: true, username: true, profilePic: true },
        },
      },
    });

    res.status(201).json({
      _id: story.id,
      user: {
        _id: story.user.id,
        username: story.user.username,
        profilePic: story.user.profilePic,
      },
      mediaUrl: story.mediaUrl,
      isVideo: story.isVideo,
      expiresAt: story.expiresAt,
      createdAt: story.createdAt,
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Get active feed stories (followed users' stories grouped by user)
// @route   GET /api/stories/feed
// @access  Protected
export const getFeedStories = async (req, res) => {
  try {
    const followedDocs = await prisma.follow.findMany({
      where: { followerId: req.user.id },
      select: { followingId: true },
    });
    
    const followedIds = followedDocs.map((doc) => doc.followingId);
    followedIds.push(req.user.id); // Include self

    // Fetch active stories
    const activeStories = await prisma.story.findMany({
      where: {
        userId: { in: followedIds },
        expiresAt: { gt: new Date() },
      },
      include: {
        user: {
          select: { id: true, username: true, profilePic: true },
        },
        viewers: true,
      },
      orderBy: { createdAt: 'asc' },
    });

    // Group by user
    const groupedStories = {};
    activeStories.forEach((story) => {
      const userId = story.userId;
      if (!groupedStories[userId]) {
        groupedStories[userId] = {
          user: {
            _id: story.user.id,
            username: story.user.username,
            profilePic: story.user.profilePic,
          },
          stories: [],
          hasUnseen: false,
        };
      }

      const isSeen = story.viewers.some((v) => v.userId === req.user.id);
      groupedStories[userId].stories.push({
        _id: story.id,
        mediaUrl: story.mediaUrl,
        isVideo: story.isVideo,
        viewers: story.viewers.map((v) => v.userId),
        createdAt: story.createdAt,
        isSeen,
      });

      if (!isSeen) {
        groupedStories[userId].hasUnseen = true;
      }
    });

    res.json(Object.values(groupedStories));
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Mark a story as seen
// @route   POST /api/stories/:id/seen
// @access  Protected
export const markStoryAsSeen = async (req, res) => {
  const { id } = req.params;

  try {
    const story = await prisma.story.findUnique({
      where: { id },
    });

    if (!story || new Date(story.expiresAt) <= new Date()) {
      return res.status(404).json({ message: 'Story not found or expired' });
    }

    const alreadySeen = await prisma.storyViewer.findUnique({
      where: {
        storyId_userId: {
          storyId: id,
          userId: req.user.id,
        },
      },
    });

    if (!alreadySeen) {
      await prisma.storyViewer.create({
        data: {
          storyId: id,
          userId: req.user.id,
        },
      });
    }

    const viewersList = await prisma.storyViewer.findMany({
      where: { storyId: id },
    });

    res.json({
      message: 'Story marked as seen',
      viewers: viewersList.map((v) => v.userId),
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
