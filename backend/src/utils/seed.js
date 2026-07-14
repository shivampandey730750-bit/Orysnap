import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';
import dotenv from 'dotenv';

dotenv.config();
const prisma = new PrismaClient();

const usersData = [
  {
    username: 'alex_adventures',
    email: 'alex@example.com',
    password: 'password123',
    profilePic: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150',
    bio: 'Travel photographer & coffee enthusiast ☕️📸',
    website: 'alexadventures.com',
  },
  {
    username: 'sophie_codes',
    email: 'sophie@example.com',
    password: 'password123',
    profilePic: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=150',
    bio: 'Software engineer | Building the future 💻🚀 | React & Node',
    website: 'sophiecodes.dev',
  },
  {
    username: 'nature_seeker',
    email: 'nature@example.com',
    password: 'password123',
    profilePic: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=150',
    bio: 'Chasing sunsets and mountain peaks 🏔️☀️',
    website: '',
  },
  {
    username: 'foodie_marcus',
    email: 'marcus@example.com',
    password: 'password123',
    profilePic: 'https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?w=150',
    bio: 'Eating my way through the world 🍣🍕🍔 | Reviewer',
    website: 'marcusfood.com',
  },
  {
    username: 'elena_art',
    email: 'elena@example.com',
    password: 'password123',
    profilePic: 'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=150',
    bio: 'Digital artist | Doodles & Designs 🎨✨',
    website: 'elenaart.space',
  },
];

const seedDB = async () => {
  try {
    await prisma.$connect();
    console.log('Connected to PostgreSQL for seeding...');

    // Clear existing data (order matters due to foreign keys)
    await prisma.notification.deleteMany();
    await prisma.message.deleteMany();
    await prisma.storyViewer.deleteMany();
    await prisma.story.deleteMany();
    await prisma.follow.deleteMany();
    await prisma.commentLike.deleteMany();
    await prisma.comment.deleteMany();
    await prisma.postLike.deleteMany();
    await prisma.post.deleteMany();
    await prisma.user.deleteMany();
    console.log('Cleared existing data.');

    // Seed Users
    const salt = await bcrypt.genSalt(10);
    const createdUsers = [];

    for (const u of usersData) {
      const hashedPassword = await bcrypt.hash(u.password, salt);
      const user = await prisma.user.create({
        data: {
          username: u.username,
          email: u.email,
          password: hashedPassword,
          profilePic: u.profilePic,
          bio: u.bio,
          website: u.website,
        },
      });
      createdUsers.push(user);
    }
    console.log(`Seeded ${createdUsers.length} users.`);

    const [alex, sophie, nature, marcus, elena] = createdUsers;

    // Seed Follows
    const follows = [
      { followerId: alex.id, followingId: sophie.id },
      { followerId: alex.id, followingId: nature.id },
      { followerId: alex.id, followingId: elena.id },
      { followerId: sophie.id, followingId: alex.id },
      { followerId: sophie.id, followingId: nature.id },
      { followerId: nature.id, followingId: alex.id },
      { followerId: nature.id, followingId: marcus.id },
      { followerId: marcus.id, followingId: sophie.id },
      { followerId: marcus.id, followingId: nature.id },
      { followerId: marcus.id, followingId: elena.id },
      { followerId: elena.id, followingId: alex.id },
      { followerId: elena.id, followingId: sophie.id },
    ];

    for (const f of follows) {
      await prisma.follow.create({
        data: f,
      });
    }
    console.log('Seeded follow relationships.');

    // Seed Posts
    const postsDataList = [
      {
        userId: alex.id,
        mediaUrls: ['https://images.unsplash.com/photo-1472214222541-d510753a49f8?w=800'],
        caption: 'Wandering through the beautiful valleys. #adventure #travel #nature',
        location: 'Swiss Alps',
        hashtags: ['adventure', 'travel', 'nature'],
        likes: [sophie.id, nature.id, elena.id],
      },
      {
        userId: sophie.id,
        mediaUrls: [
          'https://images.unsplash.com/photo-1555066931-4365d14bab8c?w=800',
          'https://images.unsplash.com/photo-1542831371-29b0f74f9713?w=800'
        ],
        caption: 'Late night coding sessions are the best! Building something cool in React. 💻🚀 #programming #webdev #reactjs',
        location: 'Tech Hub',
        hashtags: ['programming', 'webdev', 'reactjs'],
        likes: [alex.id, marcus.id],
      },
      {
        userId: nature.id,
        mediaUrls: ['https://images.unsplash.com/photo-1447752875215-b2761acb3c5d?w=800'],
        caption: 'Sun rays piercing through the forest. Peaceful mornings. 🌲✨ #naturephotography #forest #peace',
        location: 'Redwood National Park',
        hashtags: ['naturephotography', 'forest', 'peace'],
        likes: [alex.id, elena.id],
      },
      {
        userId: marcus.id,
        mediaUrls: ['https://images.unsplash.com/photo-1565299624946-b28f40a0ae38?w=800'],
        caption: 'The best Neapolitan pizza in town! Crispy crust, fresh mozzarella. 🍕🇮🇹 #foodie #pizza #italianfood',
        location: 'Naples, Italy',
        hashtags: ['foodie', 'pizza', 'italianfood'],
        likes: [sophie.id, nature.id],
      },
      {
        userId: elena.id,
        mediaUrls: ['https://images.unsplash.com/photo-1579783902614-a3fb3927b6a5?w=800'],
        caption: 'My latest digital painting. Spent 12 hours on details, let me know what you think! 🎨✨ #digitalart #painting #doodle',
        location: 'Elena Art Studio',
        hashtags: ['digitalart', 'painting', 'doodle'],
        likes: [alex.id, sophie.id, marcus.id],
      },
      {
        userId: alex.id,
        mediaUrls: ['https://images.unsplash.com/photo-1454496522488-7a8e488e8606?w=800'],
        caption: 'Conquering heights. The view from the peak is always worth it. 🏔️🌤️ #mountains #hiking #landscape',
        location: 'Mount Cook, NZ',
        hashtags: ['mountains', 'hiking', 'landscape'],
        likes: [nature.id],
      },
      {
        userId: sophie.id,
        mediaUrls: ['https://images.unsplash.com/photo-1531297484001-80022131f5a1?w=800'],
        caption: 'Setting up my new workstation. Minimalism is key. 🖥️✨ #minimalist #workspace #macbook',
        location: 'Home Office',
        hashtags: ['minimalist', 'workspace', 'macbook'],
        likes: [alex.id, elena.id],
      },
    ];

    const seededPosts = [];
    for (const p of postsDataList) {
      const { likes, ...postFields } = p;
      const post = await prisma.post.create({
        data: postFields,
      });

      // Seed Likes
      for (const likerId of likes) {
        await prisma.postLike.create({
          data: {
            postId: post.id,
            userId: likerId,
          },
        });
      }
      seededPosts.push(post);
    }
    console.log(`Seeded ${seededPosts.length} posts & likes.`);

    // Seed Comments
    const comment1 = await prisma.comment.create({
      data: {
        userId: sophie.id,
        postId: seededPosts[0].id,
        text: 'Wow, this looks absolutely stunning, Alex! I need to visit this place.',
      },
    });

    const comment2 = await prisma.comment.create({
      data: {
        userId: nature.id,
        postId: seededPosts[0].id,
        text: 'Amazing composition! The clouds look perfect.',
      },
    });

    // Reply to comment 1
    await prisma.comment.create({
      data: {
        userId: alex.id,
        postId: seededPosts[0].id,
        text: 'Thanks Sophie! You definitely should, it is even better in person.',
        parentCommentId: comment1.id,
      },
    });

    await prisma.comment.create({
      data: {
        userId: alex.id,
        postId: seededPosts[1].id,
        text: 'Nice stack! Let me know if you need any beta testers.',
      },
    });

    await prisma.comment.create({
      data: {
        userId: elena.id,
        postId: seededPosts[3].id,
        text: 'Looks mouthwatering Marcus! 🤤🍕',
      },
    });

    console.log('Seeded comments and replies.');

    // Seed Stories (Active for next 24 hours)
    const storiesDataList = [
      {
        userId: alex.id,
        mediaUrl: 'https://images.unsplash.com/photo-1469854523086-cc02fe5d8800?w=600',
        isVideo: false,
        expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000),
      },
      {
        userId: sophie.id,
        mediaUrl: 'https://images.unsplash.com/photo-1517694712202-14dd9538aa97?w=600',
        isVideo: false,
        expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000),
        viewers: [alex.id],
      },
      {
        userId: marcus.id,
        mediaUrl: 'https://images.unsplash.com/photo-1498837167922-ddd27525d352?w=600',
        isVideo: false,
        expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000),
      },
    ];

    for (const s of storiesDataList) {
      const { viewers, ...storyFields } = s;
      const story = await prisma.story.create({
        data: storyFields,
      });

      if (viewers) {
        for (const viewerId of viewers) {
          await prisma.storyViewer.create({
            data: {
              storyId: story.id,
              userId: viewerId,
            },
          });
        }
      }
    }
    console.log('Seeded stories.');

    // Seed Messages (DM History)
    const messages = [
      {
        senderId: alex.id,
        recipientId: sophie.id,
        text: 'Hey Sophie! Loved your latest post. What technology did you use for the animations?',
      },
      {
        senderId: sophie.id,
        recipientId: alex.id,
        text: 'Hey Alex! Thank you. I used Framer Motion for the React components. Highly recommend it!',
      },
      {
        senderId: alex.id,
        recipientId: sophie.id,
        text: 'Awesome, will check it out. Let me know when you want to catch up for coffee!',
        isRead: false,
      },
    ];

    for (const m of messages) {
      await prisma.message.create({
        data: m,
      });
    }
    console.log('Seeded direct messages.');

    // Seed notifications
    await prisma.notification.create({
      data: {
        senderId: sophie.id,
        recipientId: alex.id,
        type: 'LIKE',
        postId: seededPosts[0].id,
      },
    });

    await prisma.notification.create({
      data: {
        senderId: sophie.id,
        recipientId: alex.id,
        type: 'COMMENT',
        postId: seededPosts[0].id,
        commentId: comment1.id,
      },
    });

    await prisma.notification.create({
      data: {
        senderId: alex.id,
        recipientId: sophie.id,
        type: 'FOLLOW',
      },
    });

    console.log('Seeded notifications.');

    console.log('Database seeding completed successfully.');
    await prisma.$disconnect();
  } catch (error) {
    console.error('Seeding failed:', error);
    await prisma.$disconnect();
    process.exit(1);
  }
};

seedDB();
