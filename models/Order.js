import mongoose from 'mongoose';

const orderSchema = new mongoose.Schema({
  orderNumber: {
    type: String,
    unique: true,
    index: true,
  },
  customerName: {
    type: String,
    required: true,
  },
  customerEmail: {
    type: String,
    required: true,
  },
  customerPhone: {
    type: String,
    required: true,
  },
  shippingAddress: {
    street: String,
    city: String,
    state: String,
    zipCode: String,
    country: String,
  },
  products: [{
    name: String,
    quantity: Number,
    price: Number,
    capsuleType: String,
  }],
  subtotal: {
    type: Number,
    required: true,
  },
  tax: {
    type: Number,
    default: 0,
  },
  shippingFee: {
    type: Number,
    default: 0,
  },
  totalAmount: {
    type: Number,
    required: true,
  },
  paymentMethod: {
    type: String,
    enum: ['credit_card', 'paypal', 'bank_transfer', 'cod'],
    default: 'credit_card',
  },
  paymentStatus: {
    type: String,
    enum: ['pending', 'paid', 'failed', 'refunded'],
    default: 'pending',
  },
  orderStatus: {
    type: String,
    enum: ['pending', 'processing', 'shipped', 'delivered', 'cancelled'],
    default: 'pending',
  },
  notes: String,
  createdAt: {
    type: Date,
    default: Date.now,
  },
  updatedAt: {
    type: Date,
    default: Date.now,
  },
}, {
  timestamps: true // This automatically handles createdAt and updatedAt
});

// Generate order number before saving
orderSchema.pre('save', async function() {
  try {
    // Only generate order number if it doesn't exist
    if (!this.orderNumber) {
      const date = new Date();
      const year = date.getFullYear().toString().slice(-2);
      const month = (date.getMonth() + 1).toString().padStart(2, '0');
      const day = date.getDate().toString().padStart(2, '0');
      
      // Start of today
      const startOfToday = new Date(date.getFullYear(), date.getMonth(), date.getDate());
      
      // Count orders created today
      const OrderModel = mongoose.model('Order');
      const count = await OrderModel.countDocuments({
        createdAt: { $gte: startOfToday }
      });
      
      const sequential = (count + 1).toString().padStart(4, '0');
      this.orderNumber = `HV${year}${month}${day}${sequential}`;
    }
    // next();
  } catch (error) {
    // next(error);
  }
});

const Order = mongoose.model('Order', orderSchema);

export default Order;