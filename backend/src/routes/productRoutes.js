import { Router } from 'express';
import { authenticate } from '../middleware/auth.js';
import { generalLimiter, strictLimiter } from '../middleware/rateLimiter.js';
import {
  getAllProducts,
  getProductById,
  createProduct,
  updateProduct,
  deleteProduct
} from '../controllers/productController.js';

const router = Router();

// Public routes (with general rate limiting)
router.get('/', generalLimiter, getAllProducts);
router.get('/:id', generalLimiter, getProductById);

// Protected routes (admin only, with strict rate limiting)
router.post('/', strictLimiter, authenticate, createProduct);
router.put('/:id', strictLimiter, authenticate, updateProduct);
router.delete('/:id', strictLimiter, authenticate, deleteProduct);

export default router;
