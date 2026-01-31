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
      paymentMethod = 'credit_card',
      notes,
    } = req.body;

    // Validate required fields
    if (!customerName || !customerEmail || !customerPhone || !shippingAddress || !products || !subtotal) {
      return res.status(400).json({
        success: false,
        message: 'Missing required fields'
      });
    }

    const totalAmount = subtotal + tax + shippingFee;

    const order = new Order({
      orderNumber: generateOrderNumber(),
      customerName,
      customerEmail,
      customerPhone,
      shippingAddress,
      products,
      subtotal,
      tax,
      shippingFee,
      totalAmount,
      paymentMethod,
      notes,
      orderStatus: 'pending',
      paymentStatus: 'pending',
    });

    const savedOrder = await order.save();

    // Send emails - handle errors gracefully
    try {
      // Send to customer
      const customerResult = await sendOrderConfirmationEmail(savedOrder);
      if (customerResult && customerResult.success) {
        console.log(`✅ Order confirmation email sent to ${savedOrder.customerEmail}`);
      } else {
        console.error(`❌ Failed to send customer email:`, customerResult?.message);
      }
    } catch (emailError) {
      console.error('Error sending customer email:', emailError.message);
    }

    try {
      // Send to admin
      const adminResult = await sendAdminNotificationEmail(savedOrder);
      if (adminResult && adminResult.success) {
        console.log(`✅ Admin notification email sent`);
      } else {
        console.error(`❌ Failed to send admin email:`, adminResult?.message);
      }
    } catch (emailError) {
      console.error('Error sending admin email:', emailError.message);
    }

    res.status(201).json({
      success: true,
      message: 'Order created successfully',
      order: savedOrder,
    });
  } catch (error) {
    console.error('Error creating order:', error);
    
    if (error.name === 'ValidationError') {
      return res.status(400).json({
        success: false,
        message: 'Validation Error',
        errors: Object.values(error.errors).map(err => err.message),
      });
    }

    if (error.code === 11000) {
      return res.status(400).json({
        success: false,
        message: 'Duplicate order number',
      });
    }

    res.status(500).json({
      success: false,
      message: 'Error creating order',
      error: error.message,
    });
  }
};

export const getOrderByNumber = async (req, res) => {
  try {
    const { orderNumber } = req.params;
    
    const order = await Order.findOne({ orderNumber });
    
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
      limit = 10,
      status,
      startDate,
      endDate,
      sortBy = 'createdAt',
      sortOrder = 'desc',
    } = req.query;

    const query = {};
    
    if (status) {
      query.orderStatus = status;
    }
    
    if (startDate || endDate) {
      query.createdAt = {};
      if (startDate) query.createdAt.$gte = new Date(startDate);
      if (endDate) query.createdAt.$lte = new Date(endDate);
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

    if (orderStatus) order.orderStatus = orderStatus;
    if (paymentStatus) order.paymentStatus = paymentStatus;

    const updatedOrder = await order.save();

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