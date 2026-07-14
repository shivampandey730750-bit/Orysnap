import express from 'express';
import {
  createComment,
  getPostComments,
  likeComment,
  unlikeComment,
} from '../controllers/commentController.js';
import { protect } from '../middlewares/authMiddleware.js';

const router = express.Router();

router.use(protect);

router.post('/', createComment);
router.get('/post/:postId', getPostComments);
router.post('/:id/like', likeComment);
router.post('/:id/unlike', unlikeComment);

export default router;
