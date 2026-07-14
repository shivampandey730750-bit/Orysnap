import { prisma } from './config/db.js';
import dotenv from 'dotenv';

dotenv.config();

const runTest = async () => {
  console.log('Running story deletion database test...');
  try {
    // 1. Find a test user or the first user
    const user = await prisma.user.findFirst();
    if (!user) {
      console.log('No user found in database. Cannot run test.');
      return;
    }
    console.log(`Using test user: ${user.username} (${user.id})`);

    // 2. Create a temporary story
    const tempStory = await prisma.story.create({
      data: {
        userId: user.id,
        mediaUrl: 'https://example.com/test-story.jpg',
        expiresAt: new Date(Date.now() + 60 * 1000), // 1 minute from now
      },
    });
    console.log(`Created test story with ID: ${tempStory.id}`);

    // 3. Add a mock viewer to test Cascade deletion
    await prisma.storyViewer.create({
      data: {
        storyId: tempStory.id,
        userId: user.id,
      },
    });
    console.log('Added test viewer to story.');

    // 4. Try to delete the story
    console.log(`Attempting to delete story: ${tempStory.id}`);
    const deleteResult = await prisma.story.delete({
      where: { id: tempStory.id },
    });
    console.log('Delete query completed successfully!', deleteResult);
    
    console.log('Test PASSED: Story model deletes cleanly from database.');
  } catch (error) {
    console.error('Test FAILED: Database error caught during story deletion:', error);
  } finally {
    await prisma.$disconnect();
  }
};

runTest();
