import { Router } from 'express';
import { authenticate } from '../middleware/auth.js';
import { generalLimiter, strictLimiter } from '../middleware/rateLimiter.js';
import {
  getUserOrders,
  getOrderById,
  createOrder,
  getAllOrders
} from '../controllers/orderController.js';

const router = Router();

// Protected routes (require authentication + rate limiting)
router.get('/my', generalLimiter, authenticate, getUserOrders);
router.get('/all', generalLimiter, authenticate, getAllOrders); // Admin route
router.get('/:id', generalLimiter, authenticate, getOrderById);
router.post('/', strictLimiter, authenticate, createOrder);

export default router;
