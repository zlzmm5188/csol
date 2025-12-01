import { Router } from 'express';
import { authenticate } from '../middleware/auth.js';
import { authLimiter, generalLimiter } from '../middleware/rateLimiter.js';
import {
  register,
  login,
  getUserInfo,
  updateProfile,
  getBalance,
  getAllUsers,
  getUserById,
  deleteUser
} from '../controllers/userController.js';

const router = Router();

// Public routes (with auth rate limiting)
router.post('/register', authLimiter, register);
router.post('/login', authLimiter, login);

// Protected routes (require authentication + general rate limiting)
router.get('/info', generalLimiter, authenticate, getUserInfo);
router.get('/profile', generalLimiter, authenticate, getUserInfo);
router.put('/profile', generalLimiter, authenticate, updateProfile);
router.get('/balance', generalLimiter, authenticate, getBalance);
router.get('/wallet', generalLimiter, authenticate, getBalance);

// Admin routes
router.get('/', generalLimiter, authenticate, getAllUsers);
router.get('/:id', generalLimiter, authenticate, getUserById);
router.delete('/:id', generalLimiter, authenticate, deleteUser);

export default router;
