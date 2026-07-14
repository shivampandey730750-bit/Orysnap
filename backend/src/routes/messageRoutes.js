import express from 'express';
import { sendMessage, getMessagesForUser, getChatUsers } from '../controllers/messageController.js';
import { protect } from '../middlewares/authMiddleware.js';
import upload from '../middlewares/uploadMiddleware.js';

const router = express.Router();

router.use(protect);

router.post('/', upload.single('media'), sendMessage);
router.get('/chat/:userId', getMessagesForUser);
router.get('/conversations', getChatUsers);

export default router;
