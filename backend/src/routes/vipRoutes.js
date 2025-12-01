import { Router } from 'express';
import { authenticate } from '../middleware/auth.js';
import {
  getAllVipLevels,
  getVipLevelById,
  createVipLevel,
  updateVipLevel,
  deleteVipLevel,
  getUserVipProgress
} from '../controllers/vipController.js';

const router = Router();

// Public routes
router.get('/config', getAllVipLevels);
router.get('/levels', getAllVipLevels);
router.get('/levels/:level', getVipLevelById);

// Protected routes
router.get('/progress', authenticate, getUserVipProgress);
router.get('/level', authenticate, getUserVipProgress);

// Admin routes
router.post('/levels', authenticate, createVipLevel);
router.put('/levels/:level', authenticate, updateVipLevel);
router.delete('/levels/:level', authenticate, deleteVipLevel);

export default router;
