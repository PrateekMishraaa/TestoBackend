import Order from '../models/Order.js';
import emailService from '../utils/emailService.js';
import logger from '../utils/logger.js';

class OrderService {
  async createOrder(orderData) {
    try {
      logger.info('Creating new order', { email: orderData.email });
      
      // 创建订单
      const order = new Order(orderData);
      await order.save();
      
      logger.info('Order created successfully', { 
        orderNumber: order.orderNumber,
        email: order.email 
      });
      
      // 发送确认邮件（异步）
      this.sendConfirmationEmail(order);
      
      return {
        success: true,
        data: order.toClient()
      };
      
    } catch (error) {
      logger.error('Error creating order:', error);
      throw error;
    }
  }

  async getOrderByNumber(orderNumber) {
    try {
      const order = await Order.findByOrderNumber(orderNumber);
      
      if (!order) {
        return {
          success: false,
          message: 'Order not found'
        };
      }
      
      return {
        success: true,
        data: order.toClient()
      };
      
    } catch (error) {
      logger.error('Error getting order:', error);
      throw error;
    }
  }

  async getOrdersByEmail(email) {
    try {
      const orders = await Order.findByEmail(email);
      
      return {
        success: true,
        data: orders.map(order => order.toClient()),
        count: orders.length
      };
      
    } catch (error) {
      logger.error('Error getting orders by email:', error);
      throw error;
    }
  }

  async getAllOrders(query = {}) {
    try {
      const { 
        page = 1, 
        limit = 20, 
        status,
        sortBy = 'createdAt',
        sortOrder = 'desc' 
      } = query;

      const filter = {};
      if (status) filter.status = status;

      const skip = (parseInt(page) - 1) * parseInt(limit);
      const sort = { [sortBy]: sortOrder === 'asc' ? 1 : -1 };

      const orders = await Order.find(filter)
        .sort(sort)
        .skip(skip)
        .limit(parseInt(limit));

      const total = await Order.countDocuments(filter);

      return {
        success: true,
        data: orders.map(order => order.toClient()),
        pagination: {
          page: parseInt(page),
          limit: parseInt(limit),
          total,
          pages: Math.ceil(total / limit)
        }
      };
      
    } catch (error) {
      logger.error('Error getting all orders:', error);
      throw error;
    }
  }

  async sendConfirmationEmail(order) {
    try {
      const result = await emailService.sendOrderConfirmation(order);
      
      if (result.success && !result.simulated) {
        // 更新订单状态
        order.confirmationEmailSent = true;
        order.emailSentAt = new Date();
        await order.save();
        
        logger.info('Email status updated for order', { 
          orderNumber: order.orderNumber 
        });
      }
      
      return result;
      
    } catch (error) {
      logger.error('Error sending confirmation email:', error);
      // 不抛出错误，因为邮件发送失败不应该影响订单创建
    }
  }

  async getStats() {
    try {
      const totalOrders = await Order.countDocuments();
      const pendingOrders = await Order.countDocuments({ status: 'pending' });
      const deliveredOrders = await Order.countDocuments({ status: 'delivered' });
      
      const revenueResult = await Order.aggregate([
        {
          $group: {
            _id: null,
            totalRevenue: { $sum: '$totalAmount' },
            avgOrderValue: { $avg: '$totalAmount' }
          }
        }
      ]);
      
      const stats = revenueResult[0] || { totalRevenue: 0, avgOrderValue: 0 };
      
      return {
        success: true,
        data: {
          totalOrders,
          pendingOrders,
          deliveredOrders,
          totalRevenue: stats.totalRevenue,
          avgOrderValue: stats.avgOrderValue,
          timestamp: new Date().toISOString()
        }
      };
      
    } catch (error) {
      logger.error('Error getting order stats:', error);
      throw error;
    }
  }
}

// 创建单例实例
const orderService = new OrderService();

export default orderService;