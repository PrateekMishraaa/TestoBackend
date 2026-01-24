import express from 'express';
import {
  createOrder,
  getOrderByNumber,
  getAllOrders,
  updateOrderStatus,
} from '../controllers/orderController.js';
import { validateOrder } from '../middleware/Validation.js';

const router = express.Router();

router.post('/', validateOrder, createOrder);
router.get('/:orderNumber', getOrderByNumber);
router.get('/', getAllOrders);
router.put('/:orderNumber/status', updateOrderStatus);

export default router;