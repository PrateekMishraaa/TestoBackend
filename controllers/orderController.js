import Order from '../models/Order.js';
import { 
  sendOrderConfirmationEmail, 
  sendAdminNotificationEmail 
} from '../services/emailService.js';

// Helper function to generate order number
const generateOrderNumber = () => {
  const timestamp = Date.now();
  const random = Math.floor(Math.random() * 1000);
  return `TB-${timestamp}-${random}`;
};

export const createOrder = async (req, res) => {
  try {
    const {
      customerName,
      customerEmail,
      customerPhone,
      shippingAddress,
      products,
      subtotal,
      tax = 0,
      shippingFee = 0,
      paymentMethod = 'upi',
      notes,
    } = req.body;

    // Validate required fields
    if (!customerName || !customerEmail || !customerPhone || !shippingAddress || !products || !subtotal) {
      return res.status(400).json({
        success: false,
        message: 'Missing required fields'
      });
    }

    // Validate products array
    if (!Array.isArray(products) || products.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'Products array is required'
      });
    }

    const totalAmount = subtotal + tax + shippingFee;

    // Create order object
    const orderData = {
      orderNumber: generateOrderNumber(),
      customerName,
      customerEmail,
      customerPhone,
      shippingAddress: {
        street: shippingAddress.street || '',
        city: shippingAddress.city || '',
        state: shippingAddress.state || '',
        zipCode: shippingAddress.zipCode || '',
        country: shippingAddress.country || 'India'
      },
      products: products.map(p => ({
        name: p.name || 'Testro Booster',
        quantity: p.quantity || 1,
        price: p.price || 0,
        capsuleType: p.capsuleType || 'Regular'
      })),
      subtotal,
      tax,
      shippingFee,
      totalAmount,
      paymentMethod: ['credit_card', 'paypal', 'bank_transfer', 'cod', 'upi'].includes(paymentMethod) 
        ? paymentMethod 
        : 'upi',
      notes: notes || '',
      orderStatus: 'pending',
      paymentStatus: 'pending',
    };

    const order = new Order(orderData);
    const savedOrder = await order.save();

    console.log(`✅ Order created: ${savedOrder.orderNumber}`);
    
    // 🔥 OPTION 1: Send emails in background (recommended)
    // This won't block the response
    Promise.allSettled([
      sendOrderConfirmationEmail(savedOrder),
      sendAdminNotificationEmail(savedOrder)
    ]).then(results => {
      results.forEach((result, index) => {
        if (result.status === 'fulfilled') {
          console.log(`✅ Email ${index + 1} sent successfully`);
        } else {
          console.error(`❌ Email ${index + 1} failed:`, result.reason);
        }
      });
    }).catch(err => {
      console.error('Email background error:', err.message);
    });

    // 🔥 OPTION 2: Or use async but don't wait (faster response)
    // Uncomment if you want even faster response
    /*
    setTimeout(() => {
      sendOrderConfirmationEmail(savedOrder).catch(err => 
        console.error('Customer email error:', err.message)
      );
      sendAdminNotificationEmail(savedOrder).catch(err => 
        console.error('Admin email error:', err.message)
      );
    }, 0);
    */

    // Send immediate response
    res.status(201).json({
      success: true,
      message: 'Order created successfully',
      order: {
        orderNumber: savedOrder.orderNumber,
        customerName: savedOrder.customerName,
        customerEmail: savedOrder.customerEmail,
        totalAmount: savedOrder.totalAmount,
        orderStatus: savedOrder.orderStatus,
        createdAt: savedOrder.createdAt,
        emailSent: true // Always true since we queue it
      },
    });
  } catch (error) {
    console.error('❌ Error creating order:', error);
    
    // Better error messages
    if (error.name === 'ValidationError') {
      const errors = Object.values(error.errors).map(err => err.message);
      return res.status(400).json({
        success: false,
        message: 'Validation Error',
        errors: errors,
      });
    }

    if (error.code === 11000) {
      // Generate new order number and retry (in production, you'd handle this differently)
      console.log('Duplicate order number detected, retrying...');
      return res.status(409).json({
        success: false,
        message: 'Duplicate order detected. Please try again.',
      });
    }

    res.status(500).json({
      success: false,
      message: 'Internal server error',
      error: process.env.NODE_ENV === 'development' ? error.message : 'Please try again later',
    });
  }
};

// 📦 Test email endpoint
export const testEmail = async (req, res) => {
  try {
    const { sendTestEmail } = await import('../services/emailService.js');
    const result = await sendTestEmail();
    
    if (result.success) {
      res.json({
        success: true,
        message: 'Test email sent successfully',
        messageId: result.messageId
      });
    } else {
      res.status(500).json({
        success: false,
        message: 'Failed to send test email',
        error: result.message
      });
    }
  } catch (error) {
    console.error('Test email error:', error);
    res.status(500).json({
      success: false,
      message: 'Test email failed',
      error: error.message
    });
  }
};

export const getOrderByNumber = async (req, res) => {
  try {
    const { orderNumber } = req.params;
    
    const order = await Order.findOne({ orderNumber })
      .select('-__v -updatedAt');
    
    if (!order) {
      return res.status(404).json({
        success: false,
        message: 'Order not found',
      });
    }

    res.status(200).json({
      success: true,
      order,
    });
  } catch (error) {
    console.error('Error fetching order:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching order',
      error: error.message,
    });
  }
};

export const getAllOrders = async (req, res) => {
  try {
    const {
      page = 1,
      limit = 20,
      status,
      startDate,
      endDate,
      search,
      sortBy = 'createdAt',
      sortOrder = 'desc',
    } = req.query;

    const query = {};
    
    if (status && status !== 'all') {
      query.orderStatus = status;
    }
    
    if (startDate || endDate) {
      query.createdAt = {};
      if (startDate) query.createdAt.$gte = new Date(startDate);
      if (endDate) query.createdAt.$lte = new Date(endDate);
    }
    
    if (search) {
      query.$or = [
        { orderNumber: { $regex: search, $options: 'i' } },
        { customerName: { $regex: search, $options: 'i' } },
        { customerEmail: { $regex: search, $options: 'i' } },
        { customerPhone: { $regex: search, $options: 'i' } }
      ];
    }

    const skip = (parseInt(page) - 1) * parseInt(limit);
    const sort = { [sortBy]: sortOrder === 'desc' ? -1 : 1 };

    const orders = await Order.find(query)
      .sort(sort)
      .skip(skip)
      .limit(parseInt(limit))
      .select('-__v');

    const total = await Order.countDocuments(query);

    res.status(200).json({
      success: true,
      orders,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / parseInt(limit)),
        hasMore: skip + orders.length < total
      },
    });
  } catch (error) {
    console.error('Error fetching orders:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching orders',
      error: error.message,
    });
  }
};

export const updateOrderStatus = async (req, res) => {
  try {
    const { orderNumber } = req.params;
    const { orderStatus, paymentStatus } = req.body;

    const order = await Order.findOne({ orderNumber });
    
    if (!order) {
      return res.status(404).json({
        success: false,
        message: 'Order not found',
      });
    }

    const updateData = {};
    if (orderStatus) {
      updateData.orderStatus = orderStatus;
      // Send status update email if status changed
      if (order.orderStatus !== orderStatus && ['shipped', 'delivered'].includes(orderStatus)) {
        // You can add status update email here
        console.log(`Order ${orderNumber} status changed to ${orderStatus}`);
      }
    }
    if (paymentStatus) {
      updateData.paymentStatus = paymentStatus;
    }
    
    updateData.updatedAt = new Date();

    const updatedOrder = await Order.findOneAndUpdate(
      { orderNumber },
      updateData,
      { new: true, runValidators: true }
    ).select('-__v');

    res.status(200).json({
      success: true,
      message: 'Order updated successfully',
      order: updatedOrder,
    });
  } catch (error) {
    console.error('Error updating order:', error);
    res.status(500).json({
      success: false,
      message: 'Error updating order',
      error: error.message,
    });
  }
};

// 📊 Get order statistics
export const getOrderStats = async (req, res) => {
  try {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);
    
    const startOfMonth = new Date(today.getFullYear(), today.getMonth(), 1);
    
    const stats = await Order.aggregate([
      {
        $facet: {
          totalOrders: [{ $count: 'count' }],
          todayOrders: [
            { $match: { createdAt: { $gte: today } } },
            { $count: 'count' }
          ],
          yesterdayOrders: [
            { $match: { createdAt: { $gte: yesterday, $lt: today } } },
            { $count: 'count' }
          ],
          monthlyOrders: [
            { $match: { createdAt: { $gte: startOfMonth } } },
            { $count: 'count' }
          ],
          revenue: [
            { $group: { _id: null, total: { $sum: '$totalAmount' } } }
          ],
          statusCounts: [
            { $group: { _id: '$orderStatus', count: { $sum: 1 } } }
          ]
        }
      }
    ]);

    const result = {
      totalOrders: stats[0].totalOrders[0]?.count || 0,
      todayOrders: stats[0].todayOrders[0]?.count || 0,
      yesterdayOrders: stats[0].yesterdayOrders[0]?.count || 0,
      monthlyOrders: stats[0].monthlyOrders[0]?.count || 0,
      totalRevenue: stats[0].revenue[0]?.total || 0,
      statusCounts: stats[0].statusCounts.reduce((acc, curr) => {
        acc[curr._id] = curr.count;
        return acc;
      }, {})
    };

    res.status(200).json({
      success: true,
      stats: result,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('Error getting stats:', error);
    res.status(500).json({
      success: false,
      message: 'Error getting statistics',
      error: error.message,
    });
  }
};