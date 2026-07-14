import express from 'express';
import { createStory, getFeedStories, markStoryAsSeen } from '../controllers/storyController.js';
import { protect } from '../middlewares/authMiddleware.js';
import upload from '../middlewares/uploadMiddleware.js';

const router = express.Router();

router.use(protect);

router.post('/', upload.single('media'), createStory);
router.get('/feed', getFeedStories);
router.post('/:id/seen', markStoryAsSeen);

export default router;
