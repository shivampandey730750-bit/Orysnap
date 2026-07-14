import { prisma } from '../config/db.js';
import { uploadToCloudOrLocal } from '../middlewares/uploadMiddleware.js';

// @desc    Get user profile details
// @route   GET /api/users/profile/:username
// @access  Protected
export const getUserProfile = async (req, res) => {
  const { username } = req.params;

  try {
    const user = await prisma.user.findUnique({
      where: { username: username.toLowerCase() },
    });

    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    const followersCount = await prisma.follow.count({
      where: { followingId: user.id },
    });

    const followingCount = await prisma.follow.count({
      where: { followerId: user.id },
    });

    const isFollowing = await prisma.follow.findUnique({
      where: {
        followerId_followingId: {
          followerId: req.user.id,
          followingId: user.id,
        },
      },
    });

    const postsRaw = await prisma.post.findMany({
      where: { userId: user.id },
      include: {
        likes: true,
        _count: {
          select: { comments: true },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    // Map Prisma models to match original Mongoose frontend expectation
    const posts = postsRaw.map((post) => ({
      _id: post.id,
      user: {
        _id: user.id,
        username: user.username,
        profilePic: user.profilePic,
      },
      mediaUrls: post.mediaUrls,
      caption: post.caption,
      location: post.location,
      hashtags: post.hashtags,
      likes: post.likes.map((l) => l.userId),
      commentsCount: post._count.comments,
      createdAt: post.createdAt,
      updatedAt: post.updatedAt,
    }));

    res.json({
      user: {
        _id: user.id,
        username: user.username,
        email: user.email,
        profilePic: user.profilePic,
        bio: user.bio,
        website: user.website,
        isPrivate: user.isPrivate,
        createdAt: user.createdAt,
        followersCount,
        followingCount,
        isFollowing: !!isFollowing,
        postsCount: posts.length,
      },
      posts,
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Update user profile details
// @route   PUT /api/users/profile
// @access  Protected
export const updateUserProfile = async (req, res) => {
  try {
    const user = await prisma.user.findUnique({
      where: { id: req.user.id },
    });

    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    const dataToUpdate = {};
    if (req.body.bio !== undefined) dataToUpdate.bio = req.body.bio;
    if (req.body.website !== undefined) dataToUpdate.website = req.body.website;
    if (req.body.isPrivate !== undefined) {
      dataToUpdate.isPrivate = req.body.isPrivate === 'true' || req.body.isPrivate === true;
    }

    // Check username change
    if (req.body.username) {
      const cleanUsername = req.body.username.trim().toLowerCase();
      if (cleanUsername !== user.username) {
        if (cleanUsername.includes(' ') || !cleanUsername) {
          return res.status(400).json({ message: 'Username cannot contain spaces or be empty' });
        }
        if (cleanUsername.length < 3) {
          return res.status(400).json({ message: 'Username must be at least 3 characters long' });
        }
        const usernameExists = await prisma.user.findUnique({
          where: { username: cleanUsername },
        });
        if (usernameExists) {
          return res.status(400).json({ message: 'Username is already taken' });
        }
        dataToUpdate.username = cleanUsername;
      }
    }

    // Handle profile pic upload
    if (req.file) {
      const uploadUrl = await uploadToCloudOrLocal(req.file);
      if (uploadUrl) {
        dataToUpdate.profilePic = uploadUrl;
      }
    }

    const updatedUser = await prisma.user.update({
      where: { id: req.user.id },
      data: dataToUpdate,
    });

    const followersCount = await prisma.follow.count({
      where: { followingId: updatedUser.id },
    });

    const followingCount = await prisma.follow.count({
      where: { followerId: updatedUser.id },
    });

    res.json({
      _id: updatedUser.id,
      username: updatedUser.username,
      email: updatedUser.email,
      profilePic: updatedUser.profilePic,
      bio: updatedUser.bio,
      website: updatedUser.website,
      isPrivate: updatedUser.isPrivate,
      followersCount,
      followingCount,
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Search users by username
// @route   GET /api/users/search
// @access  Protected
export const searchUsers = async (req, res) => {
  const { q } = req.query;

  try {
    if (!q) {
      return res.json([]);
    }

    const usersRaw = await prisma.user.findMany({
      where: {
        username: {
          contains: q.toLowerCase(),
          mode: 'insensitive',
        },
        id: {
          not: req.user.id,
        },
      },
      select: {
        id: true,
        username: true,
        profilePic: true,
        bio: true,
      },
      take: 10,
    });

    const users = usersRaw.map((u) => ({
      _id: u.id,
      username: u.username,
      profilePic: u.profilePic,
      bio: u.bio,
    }));

    res.json(users);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Delete user account
// @route   DELETE /api/users/profile
// @access  Protected
export const deleteUserAccount = async (req, res) => {
  try {
    await prisma.user.delete({
      where: { id: req.user.id },
    });

    res.json({ message: 'Account deleted successfully' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Get user by ID
// @route   GET /api/users/find/:id
// @access  Protected
export const getUserById = async (req, res) => {
  try {
    const user = await prisma.user.findUnique({
      where: { id: req.params.id },
      select: {
        id: true,
        username: true,
        profilePic: true,
        bio: true,
      },
    });

    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    res.json({
      _id: user.id,
      username: user.username,
      profilePic: user.profilePic,
      bio: user.bio,
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

