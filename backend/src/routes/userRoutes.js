import express from 'express';
import { getUserProfile, updateUserProfile, searchUsers, deleteUserAccount, getUserById } from '../controllers/userController.js';
import { protect } from '../middlewares/authMiddleware.js';
import upload from '../middlewares/uploadMiddleware.js';

const router = express.Router();

router.get('/search', protect, searchUsers);
router.get('/profile/:username', protect, getUserProfile);
router.put('/profile', protect, upload.single('profilePic'), updateUserProfile);
router.delete('/profile', protect, deleteUserAccount);
router.get('/find/:id', protect, getUserById);

export default router;
