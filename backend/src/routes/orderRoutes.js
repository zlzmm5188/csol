import { Router } from 'express';
import { authenticate } from '../middleware/auth.js';
import {
  getUserOrders,
  getOrderById,
  createOrder,
  getAllOrders
} from '../controllers/orderController.js';

const router = Router();

// Protected routes (require authentication)
router.get('/my', authenticate, getUserOrders);
router.get('/all', authenticate, getAllOrders); // Admin route
router.get('/:id', authenticate, getOrderById);
router.post('/', authenticate, createOrder);

export default router;
