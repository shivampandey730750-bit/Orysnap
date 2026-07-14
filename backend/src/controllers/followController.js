import { prisma } from '../config/db.js';
import { sendRealtimeNotification } from '../server.js';

// @desc    Toggle follow/unfollow user
// @route   POST /api/follows/toggle/:userId
// @access  Protected
export const toggleFollow = async (req, res) => {
  const { userId } = req.params;

  try {
    if (userId === req.user.id) {
      return res.status(400).json({ message: 'You cannot follow yourself' });
    }

    const userToFollow = await prisma.user.findUnique({
      where: { id: userId },
    });

    if (!userToFollow) {
      return res.status(404).json({ message: 'User not found' });
    }

    const existingFollow = await prisma.follow.findUnique({
      where: {
        followerId_followingId: {
          followerId: req.user.id,
          followingId: userId,
        },
      },
    });

    if (existingFollow) {
      // Unfollow
      await prisma.follow.delete({
        where: {
          followerId_followingId: {
            followerId: req.user.id,
            followingId: userId,
          },
        },
      });

      // Delete notification
      await prisma.notification.deleteMany({
        where: {
          senderId: req.user.id,
          recipientId: userId,
          type: 'FOLLOW',
        },
      });

      return res.json({ isFollowing: false, message: 'Unfollowed user' });
    } else {
      // Follow
      await prisma.follow.create({
        data: {
          followerId: req.user.id,
          followingId: userId,
        },
      });

      // Create notification
      const notification = await prisma.notification.create({
        data: {
          senderId: req.user.id,
          recipientId: userId,
          type: 'FOLLOW',
        },
      });

      sendRealtimeNotification(userId, notification.id);

      return res.json({ isFollowing: true, message: 'Followed user' });
    }
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Get followers list for a user
// @route   GET /api/follows/followers/:userId
// @access  Protected
export const getFollowersList = async (req, res) => {
  const { userId } = req.params;

  try {
    const followers = await prisma.follow.findMany({
      where: { followingId: userId },
      include: {
        follower: {
          select: { id: true, username: true, profilePic: true, bio: true },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    res.json(
      followers.map((f) => ({
        _id: f.follower.id,
        username: f.follower.username,
        profilePic: f.follower.profilePic,
        bio: f.follower.bio,
      }))
    );
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Get following list for a user
// @route   GET /api/follows/following/:userId
// @access  Protected
export const getFollowingList = async (req, res) => {
  const { userId } = req.params;

  try {
    const following = await prisma.follow.findMany({
      where: { followerId: userId },
      include: {
        following: {
          select: { id: true, username: true, profilePic: true, bio: true },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    res.json(
      following.map((f) => ({
        _id: f.following.id,
        username: f.following.username,
        profilePic: f.following.profilePic,
        bio: f.following.bio,
      }))
    );
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
