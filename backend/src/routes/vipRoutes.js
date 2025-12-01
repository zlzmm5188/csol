import { Router } from 'express';
import { authenticate } from '../middleware/auth.js';
import { generalLimiter, strictLimiter } from '../middleware/rateLimiter.js';
import {
  getAllVipLevels,
  getVipLevelById,
  createVipLevel,
  updateVipLevel,
  deleteVipLevel,
  getUserVipProgress
} from '../controllers/vipController.js';

const router = Router();

// Public routes (with general rate limiting)
router.get('/config', generalLimiter, getAllVipLevels);
router.get('/levels', generalLimiter, getAllVipLevels);
router.get('/levels/:level', generalLimiter, getVipLevelById);

// Protected routes
router.get('/progress', generalLimiter, authenticate, getUserVipProgress);
router.get('/level', generalLimiter, authenticate, getUserVipProgress);

// Admin routes (with strict rate limiting)
router.post('/levels', strictLimiter, authenticate, createVipLevel);
router.put('/levels/:level', strictLimiter, authenticate, updateVipLevel);
router.delete('/levels/:level', strictLimiter, authenticate, deleteVipLevel);

export default router;
