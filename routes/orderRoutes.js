import express from 'express';
import {
  createOrder,
  getOrderByNumber,
  getAllOrders,
  updateOrderStatus,
  testEmail,
  getOrderStats
} from '../controllers/orderController.js';

const router = express.Router();

// 📧 Email test endpoint
router.get('/test-email', testEmail);

// 📦 Order routes
router.post('/', createOrder);
router.get('/stats', getOrderStats);
router.get('/:orderNumber', getOrderByNumber);
router.get('/', getAllOrders);
router.patch('/:orderNumber/status', updateOrderStatus);

export default router;