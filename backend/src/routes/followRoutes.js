import express from 'express';
import {
  toggleFollow,
  getFollowersList,
  getFollowingList,
} from '../controllers/followController.js';
import { protect } from '../middlewares/authMiddleware.js';

const router = express.Router();

router.use(protect);

router.post('/toggle/:userId', toggleFollow);
router.get('/followers/:userId', getFollowersList);
router.get('/following/:userId', getFollowingList);

export default router;
