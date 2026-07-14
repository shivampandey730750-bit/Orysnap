import express from 'express';
import { getUserProfile, updateUserProfile, searchUsers } from '../controllers/userController.js';
import { protect } from '../middlewares/authMiddleware.js';
import upload from '../middlewares/uploadMiddleware.js';

const router = express.Router();

router.get('/search', protect, searchUsers);
router.get('/profile/:username', protect, getUserProfile);
router.put('/profile', protect, upload.single('profilePic'), updateUserProfile);

export default router;
