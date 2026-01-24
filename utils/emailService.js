import nodemailer from 'nodemailer';
import { emailConfig, isEmailConfigured } from '../config/emailConfig.js';
import logger from './logger.js';

class EmailService {
  constructor() {
    this.transporter = null;
    this.initialized = false;
    this.init();
  }

  init() {
    if (!isEmailConfigured()) {
      logger.warn('Email service not configured. Running in simulation mode.');
      return;
    }

    try {
      this.transporter = nodemailer.createTransport({
        host: emailConfig.host,
        port: emailConfig.port,
        secure: emailConfig.secure,
        auth: emailConfig.auth,
        tls: {
          rejectUnauthorized: false // 开发环境使用，生产环境应该为true
        }
      });

      // 验证连接
      this.transporter.verify((error) => {
        if (error) {
          logger.error('Email transporter verification failed:', error);
          this.initialized = false;
        } else {
          logger.info('Email service initialized successfully');
          this.initialized = true;
        }
      });
    } catch (error) {
      logger.error('Failed to initialize email service:', error);
      this.initialized = false;
    }
  }

  async sendOrderConfirmation(order) {
    // 如果没有配置邮件服务，模拟发送
    if (!this.initialized) {
      logger.info(`[Simulated] Order confirmation email would be sent to ${order.email}`);
      return {
        success: true,
        simulated: true,
        message: 'Email sent in simulation mode'
      };
    }

    try {
      const mailOptions = {
        from: `"Health Veda Capsule" <${emailConfig.from}>`,
        to: order.email,
        subject: `✅ Order Confirmation - ${order.orderNumber}`,
        html: this.generateOrderConfirmationHtml(order),
        text: this.generateOrderConfirmationText(order)
      };

      const info = await this.transporter.sendMail(mailOptions);
      
      logger.info(`Order confirmation email sent to ${order.email}`, {
        messageId: info.messageId
      });
      
      return {
        success: true,
        messageId: info.messageId,
        previewUrl: nodemailer.getTestMessageUrl(info)
      };
    } catch (error) {
      logger.error(`Failed to send order confirmation email to ${order.email}:`, error);
      return {
        success: false,
        error: error.message
      };
    }
  }

  generateOrderConfirmationHtml(order) {
    return `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Order Confirmation</title>
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background: #dc2626; color: white; padding: 20px; text-align: center; border-radius: 10px 10px 0 0; }
          .content { background: #f9f9f9; padding: 20px; border: 1px solid #ddd; border-top: none; border-radius: 0 0 10px 10px; }
          .order-details { background: white; border-radius: 5px; padding: 15px; margin: 15px 0; }
          table { width: 100%; border-collapse: collapse; }
          th, td { padding: 10px; text-align: left; border-bottom: 1px solid #ddd; }
          .footer { text-align: center; margin-top: 20px; padding-top: 20px; border-top: 1px solid #ddd; color: #666; font-size: 12px; }
        </style>
      </head>
      <body>
        <div class="header">
          <h1>Thank You for Your Order!</h1>
        </div>
        
        <div class="content">
          <h2>Order Details</h2>
          <div class="order-details">
            <table>
              <tr><th>Order Number:</th><td><strong>${order.orderNumber}</strong></td></tr>
              <tr><th>Name:</th><td>${order.name}</td></tr>
              <tr><th>Email:</th><td>${order.email}</td></tr>
              <tr><th>Phone:</th><td>${order.phone}</td></tr>
              <tr><th>Address:</th><td>${order.address}<br>ZIP: ${order.zipCode}</td></tr>
            </table>
          </div>
          
          <div class="order-details">
            <h3>Product Information</h3>
            <table>
              <tr><th>Product</th><th>Quantity</th><th>Price</th><th>Total</th></tr>
              <tr>
                <td>Health Veda Capsule</td>
                <td>${order.quantity}</td>
                <td>₹${order.price}</td>
                <td><strong>₹${order.totalAmount}</strong></td>
              </tr>
            </table>
          </div>
          
          <p><strong>Delivery:</strong> Our delivery partner will contact you within 24 hours.</p>
          <p><strong>Payment:</strong> Cash on Delivery (Pay when you receive the product)</p>
        </div>
        
        <div class="footer">
          <p>© 2024 Health Veda Capsule. All rights reserved.</p>
        </div>
      </body>
      </html>
    `;
  }

  generateOrderConfirmationText(order) {
    return `
Order Confirmation - Health Veda Capsule
=========================================

Order Number: ${order.orderNumber}
Name: ${order.name}
Email: ${order.email}
Phone: ${order.phone}
Address: ${order.address}
ZIP Code: ${order.zipCode}

Product: Health Veda Capsule
Quantity: ${order.quantity}
Price: ₹${order.price}
Total Amount: ₹${order.totalAmount}

Our delivery partner will contact you within 24 hours.
Payment: Cash on Delivery

© 2024 Health Veda Capsule
    `;
  }
}

// 创建单例实例
const emailService = new EmailService();

export default emailService;