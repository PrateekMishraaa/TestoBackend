import nodemailer from 'nodemailer';

const createTransporter = () => {
  return nodemailer.createTransport({
    host: process.env.SMTP_HOST || 'smtp.gmail.com',
    port: process.env.SMTP_PORT || 587,
    secure: process.env.SMTP_SECURE === 'true',
    auth: {
      user: process.env.SMTP_USER,
      pass: process.env.SMTP_PASS,
    },
  });
};

// Send order confirmation email to customer
export const sendOrderConfirmationEmail = async (order) => {
  try {
    const transporter = createTransporter();
    
    const productsList = order.products.map(product => 
      `<tr>
        <td>${product.name}</td>
        <td>${product.capsuleType}</td>
        <td>${product.quantity}</td>
        <td>$${product.price.toFixed(2)}</td>
        <td>$${(product.quantity * product.price).toFixed(2)}</td>
      </tr>`
    ).join('');

    const mailOptions = {
      from: `"Testro Booster" <${process.env.SMTP_USER}>`,
      to: order.customerEmail,
      subject: `Order Confirmation - ${order.orderNumber}`,
      html: `
        <!DOCTYPE html>
        <html>
        <head>
          <style>
            body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; }
            .header { background-color: #3B82F6; color: white; padding: 20px; text-align: center; }
            .content { background-color: #f9f9f9; padding: 20px; }
            .order-details { width: 100%; border-collapse: collapse; margin: 20px 0; }
            .order-details th, .order-details td { border: 1px solid #ddd; padding: 10px; text-align: left; }
            .order-details th { background-color: #f2f2f2; }
            .footer { text-align: center; margin-top: 30px; color: #666; font-size: 12px; }
            .total-row { font-weight: bold; background-color: #f0f0f0; }
            .energy-badge { background-color: #6366F1; color: white; padding: 4px 12px; border-radius: 20px; font-size: 12px; display: inline-block; margin-left: 10px; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>Testro Booster</h1>
              <h2>Order Confirmation</h2>
              <span class="energy-badge">⚡ Energy & Performance</span>
            </div>
            <div class="content">
              <p>Dear ${order.customerName},</p>
              <p>Thank you for choosing Testro Booster! Your order has been received and is being processed.</p>
              
              <h3>Order Details</h3>
              <table class="order-details">
                <tr>
                  <th>Order Number:</th>
                  <td>${order.orderNumber}</td>
                </tr>
                <tr>
                  <th>Order Date:</th>
                  <td>${new Date(order.createdAt).toLocaleDateString()}</td>
                </tr>
                <tr>
                  <th>Status:</th>
                  <td>${order.orderStatus}</td>
                </tr>
                <tr>
                  <th>Payment Status:</th>
                  <td>${order.paymentStatus}</td>
                </tr>
              </table>
              
              <h3>Items Ordered</h3>
              <table class="order-details">
                <thead>
                  <tr>
                    <th>Product</th>
                    <th>Type</th>
                    <th>Quantity</th>
                    <th>Price</th>
                    <th>Total</th>
                  </tr>
                </thead>
                <tbody>
                  ${productsList}
                </tbody>
                <tfoot>
                  <tr class="total-row">
                    <td colspan="4" style="text-align: right;">Subtotal:</td>
                    <td>$${order.subtotal.toFixed(2)}</td>
                  </tr>
                  <tr class="total-row">
                    <td colspan="4" style="text-align: right;">Tax:</td>
                    <td>$${order.tax.toFixed(2)}</td>
                  </tr>
                  <tr class="total-row">
                    <td colspan="4" style="text-align: right;">Shipping:</td>
                    <td>$${order.shippingFee.toFixed(2)}</td>
                  </tr>
                  <tr class="total-row">
                    <td colspan="4" style="text-align: right;">Total Amount:</td>
                    <td>$${order.totalAmount.toFixed(2)}</td>
                  </tr>
                </tfoot>
              </table>
              
              <h3>Shipping Address</h3>
              <p>
                ${order.shippingAddress.street}<br>
                ${order.shippingAddress.city}, ${order.shippingAddress.state} ${order.shippingAddress.zipCode}<br>
                ${order.shippingAddress.country}
              </p>
              
              <p><strong>📦 Shipping Information:</strong><br>
              Your order will be shipped within 24 hours. You will receive tracking information via email once shipped.</p>
              
              <p><strong>⚡ Expected Delivery:</strong><br>
              3-5 business days for metro cities, 5-7 days for other locations.</p>
              
              <p><strong>💡 Usage Tip:</strong><br>
              For best results, take 1-2 capsules in the morning or before physical activity. Stay hydrated!</p>
              
              <p>If you have any questions, please contact our customer support.</p>
              
              <p>Best regards,<br>The Testro Booster Team</p>
            </div>
            <div class="footer">
              <p>© ${new Date().getFullYear()} Testro Booster. All rights reserved.</p>
              <p>Unleash Your Energy Potential • Natural Ingredients • Fast-Acting Formula</p>
              <p>This is an automated email, please do not reply.</p>
            </div>
          </div>
        </body>
        </html>
      `,
    };

    const info = await transporter.sendMail(mailOptions);
    console.log(`📧 Testro Booster order confirmation email sent to ${order.customerEmail}: ${info.messageId}`);
    return info;
  } catch (error) {
    console.error(`❌ Error sending email:`, error);
    throw error;
  }
};

// Send notification email to admin
export const sendAdminNotificationEmail = async (order) => {
  try {
    const transporter = createTransporter();
    
    const mailOptions = {
      from: `"Testro Booster Order System" <${process.env.SMTP_USER}>`,
      to: process.env.ADMIN_EMAIL || process.env.SMTP_USER,
      subject: `🚀 New Testro Booster Order - ${order.orderNumber}`,
      html: `
        <!DOCTYPE html>
        <html>
        <head>
          <style>
            body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; }
            .header { background-color: #6366F1; color: white; padding: 20px; text-align: center; }
            .content { background-color: #f9f9f9; padding: 20px; }
            .order-details { width: 100%; border-collapse: collapse; margin: 20px 0; }
            .order-details th, .order-details td { border: 1px solid #ddd; padding: 10px; text-align: left; }
            .order-details th { background-color: #f2f2f2; }
            .alert { background-color: #dbeafe; border: 1px solid #93c5fd; padding: 15px; margin: 20px 0; border-radius: 8px; }
            .energy-icon { color: #6366F1; font-size: 20px; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>⚡ New Testro Booster Order</h1>
              <p>Energy Unleashed!</p>
            </div>
            <div class="content">
              <div class="alert">
                <strong>🚀 ACTION REQUIRED:</strong> A new Testro Booster order has been placed and requires processing.
              </div>
              
              <h3>⚡ Order Summary</h3>
              <table class="order-details">
                <tr>
                  <th>Order Number:</th>
                  <td><strong>${order.orderNumber}</strong></td>
                </tr>
                <tr>
                  <th>Customer:</th>
                  <td>${order.customerName}</td>
                </tr>
                <tr>
                  <th>Email:</th>
                  <td>${order.customerEmail}</td>
                </tr>
                <tr>
                  <th>Phone:</th>
                  <td>${order.customerPhone}</td>
                </tr>
                <tr>
                  <th>Total Amount:</th>
                  <td><strong>$${order.totalAmount.toFixed(2)}</strong></td>
                </tr>
                <tr>
                  <th>Payment Method:</th>
                  <td>${order.paymentMethod}</td>
                </tr>
                <tr>
                  <th>Order Date:</th>
                  <td>${new Date(order.createdAt).toLocaleString()}</td>
                </tr>
              </table>
              
              <h3>📦 Order Items</h3>
              <table class="order-details">
                <thead>
                  <tr>
                    <th>Product</th>
                    <th>Type</th>
                    <th>Quantity</th>
                    <th>Price</th>
                  </tr>
                </thead>
                <tbody>
                  ${order.products.map(product => `
                    <tr>
                      <td>${product.name}</td>
                      <td>${product.capsuleType}</td>
                      <td>${product.quantity}</td>
                      <td>$${product.price.toFixed(2)}</td>
                    </tr>
                  `).join('')}
                </tbody>
              </table>
              
              <h3>📍 Shipping Address</h3>
              <p>
                ${order.shippingAddress.street}<br>
                ${order.shippingAddress.city}, ${order.shippingAddress.state} ${order.shippingAddress.zipCode}<br>
                ${order.shippingAddress.country}
              </p>
              
              <div style="background-color: #f0f9ff; padding: 15px; border-radius: 8px; margin-top: 20px;">
                <p><strong>📋 Next Steps:</strong></p>
                <ol>
                  <li>Process the order within 24 hours</li>
                  <li>Generate shipping label</li>
                  <li>Update order status to "Processing"</li>
                  <li>Send tracking information to customer</li>
                </ol>
              </div>
              
              <p style="margin-top: 20px;">
                <a href="${process.env.ADMIN_DASHBOARD_URL || '#'}" style="background-color: #6366F1; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px; display: inline-block;">
                  📊 View Order in Dashboard
                </a>
              </p>
              
              <p style="margin-top: 20px; font-size: 12px; color: #666;">
                This is an automated notification from Testro Booster Order System.
              </p>
            </div>
          </div>
        </body>
        </html>
      `,
    };

    const info = await transporter.sendMail(mailOptions);
    console.log(`📧 Testro Booster admin notification email sent: ${info.messageId}`);
    return info;
  } catch (error) {
    console.error(`❌ Error sending admin email:`, error);
    throw error;
  }
};