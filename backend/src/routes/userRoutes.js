import { Router } from 'express';
import { authenticate } from '../middleware/auth.js';
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

// Public routes
router.post('/register', register);
router.post('/login', login);

// Protected routes (require authentication)
router.get('/info', authenticate, getUserInfo);
router.get('/profile', authenticate, getUserInfo);
router.put('/profile', authenticate, updateProfile);
router.get('/balance', authenticate, getBalance);
router.get('/wallet', authenticate, getBalance);

// Admin routes
router.get('/', authenticate, getAllUsers);
router.get('/:id', authenticate, getUserById);
router.delete('/:id', authenticate, deleteUser);

export default router;
