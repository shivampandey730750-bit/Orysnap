import express from 'express';
import {
  createPost,
  getFeedPosts,
  getExplorePosts,
  likePost,
  unlikePost,
  getPostById,
  deletePost,
} from '../controllers/postController.js';
import { protect } from '../middlewares/authMiddleware.js';
import upload from '../middlewares/uploadMiddleware.js';

const router = express.Router();

router.use(protect); // Require auth for all post routes

router.post('/', upload.array('media', 10), createPost);
router.get('/feed', getFeedPosts);
router.get('/explore', getExplorePosts);
router.get('/:id', getPostById);
router.delete('/:id', deletePost);
router.post('/:id/like', likePost);
router.post('/:id/unlike', unlikePost);

export default router;
