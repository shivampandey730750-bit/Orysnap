import express from 'express';
import { createStory, getFeedStories, markStoryAsSeen, deleteStory, getStoryViewers } from '../controllers/storyController.js';
import { protect } from '../middlewares/authMiddleware.js';
import upload from '../middlewares/uploadMiddleware.js';

const router = express.Router();

router.use(protect);

router.post('/', upload.single('media'), createStory);
router.get('/feed', getFeedStories);
router.post('/:id/seen', markStoryAsSeen);
router.get('/:id/viewers', getStoryViewers);
router.delete('/:id', deleteStory);

export default router;
