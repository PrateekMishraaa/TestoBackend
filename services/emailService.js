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
    
    // Format Indian Rupee
    const formatINR = (amount) => {
      return new Intl.NumberFormat('en-IN', {
        style: 'currency',
        currency: 'INR',
        minimumFractionDigits: 0,
        maximumFractionDigits: 0
      }).format(amount);
    };
    
    const productsList = order.products.map(product => 
      `<tr>
        <td>${product.name}</td>
        <td>${product.capsuleType}</td>
        <td>${product.quantity}</td>
        <td>${formatINR(product.price)}</td>
        <td>${formatINR(product.quantity * product.price)}</td>
      </tr>`
    ).join('');

    const mailOptions = {
      from: `"Testro Booster" <${process.env.SMTP_USER}>`,
      to: order.customerEmail,
      subject: `🔥 Order Confirmation - ${order.orderNumber}`,
      html: `
        <!DOCTYPE html>
        <html>
        <head>
          <style>
            body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; margin: 0; padding: 0; }
            .container { max-width: 600px; margin: 0 auto; background-color: #000000; color: #ffffff; }
            .header { background: linear-gradient(to right, #991b1b, #b45309); padding: 30px; text-align: center; }
            .content { background-color: #111827; padding: 30px; }
            .order-details { width: 100%; border-collapse: collapse; margin: 20px 0; border: 1px solid #374151; }
            .order-details th, .order-details td { border: 1px solid #374151; padding: 12px; text-align: left; }
            .order-details th { background-color: #1f2937; color: #d1d5db; }
            .footer { text-align: center; margin-top: 30px; color: #9ca3af; font-size: 12px; padding: 20px; border-top: 1px solid #374151; }
            .total-row { font-weight: bold; background-color: #1f2937; }
            .energy-badge { background: linear-gradient(to right, #991b1b, #b45309); color: white; padding: 8px 16px; border-radius: 20px; font-size: 14px; display: inline-block; margin: 5px; }
            .info-box { background-color: #1f2937; border-left: 4px solid #b45309; padding: 15px; margin: 20px 0; border-radius: 5px; }
            .highlight { color: #fbbf24; font-weight: bold; }
            .order-number { font-size: 24px; color: #fbbf24; font-weight: bold; }
            .testro-logo { font-size: 28px; font-weight: bold; background: linear-gradient(to right, #fbbf24, #f59e0b); -webkit-background-clip: text; -webkit-text-fill-color: transparent; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1 class="testro-logo">TESTROBOOSTER</h1>
              <h2 style="color: white; margin: 10px 0;">Order Confirmation</h2>
              <span class="energy-badge">⚡ Unleash Your Inner Power</span>
            </div>
            <div class="content">
              <p>Dear <span class="highlight">${order.customerName}</span>,</p>
              <p>Thank you for choosing <strong>Testro Booster</strong>! Your order has been received and is being processed.</p>
              
              <div class="info-box">
                <h3 style="margin: 0; color: #fbbf24;">🎯 Order Details</h3>
                <table style="width: 100%; margin-top: 10px;">
                  <tr>
                    <td><strong>Order Number:</strong></td>
                    <td class="order-number">${order.orderNumber}</td>
                  </tr>
                  <tr>
                    <td><strong>Order Date:</strong></td>
                    <td>${new Date(order.createdAt).toLocaleDateString('en-IN')}</td>
                  </tr>
                  <tr>
                    <td><strong>Status:</strong></td>
                    <td><span style="color: #10b981;">${order.orderStatus}</span></td>
                  </tr>
                  <tr>
                    <td><strong>Payment Method:</strong></td>
                    <td>${order.paymentMethod === 'cod' ? 'Cash on Delivery' : 
                         order.paymentMethod === 'upi' ? 'UPI Payment' : 
                         order.paymentMethod === 'credit_card' ? 'Credit/Debit Card' : 
                         'Net Banking'}</td>
                  </tr>
                </table>
              </div>
              
              <h3 style="color: #fbbf24;">📦 Items Ordered</h3>
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
                    <td>${formatINR(order.subtotal)}</td>
                  </tr>
                  <tr class="total-row">
                    <td colspan="4" style="text-align: right;">Tax (8%):</td>
                    <td>${formatINR(order.tax)}</td>
                  </tr>
                  <tr class="total-row">
                    <td colspan="4" style="text-align: right;">Shipping:</td>
                    <td>${order.shippingFee === 0 ? '<span style="color: #10b981;">FREE</span>' : formatINR(order.shippingFee)}</td>
                  </tr>
                  <tr class="total-row" style="background: linear-gradient(to right, #991b1b, #b45309);">
                    <td colspan="4" style="text-align: right; color: white;">Total Amount:</td>
                    <td style="color: white; font-size: 18px;">${formatINR(order.totalAmount)}</td>
                  </tr>
                </tfoot>
              </table>
              
              <div class="info-box">
                <h3 style="margin: 0; color: #fbbf24;">📍 Shipping Address</h3>
                <p style="margin: 10px 0;">
                  ${order.shippingAddress.street}<br>
                  ${order.shippingAddress.city}, ${order.shippingAddress.state} ${order.shippingAddress.zipCode}<br>
                  ${order.shippingAddress.country}
                </p>
              </div>
              
              <div style="margin: 30px 0;">
                <h3 style="color: #fbbf24;">🚚 Shipping Information</h3>
                <p><strong>⏱️ Processing Time:</strong> Your order will be processed within 24 hours.</p>
                <p><strong>📦 Shipping:</strong> You will receive tracking information via email once shipped.</p>
                <p><strong>📅 Expected Delivery:</strong> 3-5 business days for metro cities, 5-7 days for other locations.</p>
              </div>
              
              <div style="background-color: #1f2937; border-radius: 10px; padding: 20px; margin: 20px 0; border: 1px solid #b45309;">
                <h3 style="color: #fbbf24; margin-top: 0;">💡 Testro Booster Usage Tips</h3>
                <ul style="margin: 10px 0; padding-left: 20px;">
                  <li>Take 1-2 capsules daily with water or milk</li>
                  <li>Best taken in the morning or before physical activity</li>
                  <li>Consistent use yields best results</li>
                  <li>Maintain a healthy lifestyle for optimal benefits</li>
                </ul>
              </div>
              
              <div style="text-align: center; margin: 30px 0;">
                <p style="font-size: 18px; color: #fbbf24;">Unleash Your Energy Potential with Testro Booster! 💪</p>
                <p>If you have any questions, contact us at <a href="mailto:support@testrobooster.com" style="color: #fbbf24;">support@testrobooster.com</a> or call +91 98765 43210</p>
              </div>
              
              <p>Best regards,<br><strong>The Testro Booster Team</strong></p>
            </div>
            <div class="footer">
              <p>© ${new Date().getFullYear()} Testro Booster. All rights reserved.</p>
              <p>Premium Male Vitality Support Formula • Made in India 🇮🇳</p>
              <p>This is an automated email, please do not reply directly.</p>
              <p style="margin-top: 10px; font-size: 11px; color: #6b7280;">
                ⚠️ Disclaimer: Testro Booster is a wellness supplement. Results may vary. Consult your healthcare professional before use.
              </p>
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
    
    // Format Indian Rupee
    const formatINR = (amount) => {
      return new Intl.NumberFormat('en-IN', {
        style: 'currency',
        currency: 'INR',
        minimumFractionDigits: 0,
        maximumFractionDigits: 0
      }).format(amount);
    };
    
    const mailOptions = {
      from: `"Testro Booster Order System" <${process.env.SMTP_USER}>`,
      to: process.env.ADMIN_EMAIL || process.env.SMTP_USER,
      subject: `🚀 NEW TESTRO BOOSTER ORDER - ${order.orderNumber}`,
      html: `
        <!DOCTYPE html>
        <html>
        <head>
          <style>
            body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; margin: 0; padding: 0; }
            .container { max-width: 600px; margin: 0 auto; background-color: #000000; color: #ffffff; }
            .header { background: linear-gradient(to right, #991b1b, #b45309); padding: 30px; text-align: center; }
            .content { background-color: #111827; padding: 30px; }
            .order-details { width: 100%; border-collapse: collapse; margin: 20px 0; border: 1px solid #374151; }
            .order-details th, .order-details td { border: 1px solid #374151; padding: 12px; text-align: left; }
            .order-details th { background-color: #1f2937; color: #d1d5db; }
            .alert { background: linear-gradient(to right, #991b1b, #b45309); color: white; padding: 20px; margin: 20px 0; border-radius: 8px; text-align: center; font-size: 18px; }
            .info-box { background-color: #1f2937; border-left: 4px solid #b45309; padding: 15px; margin: 20px 0; border-radius: 5px; }
            .highlight { color: #fbbf24; font-weight: bold; }
            .urgent { color: #ef4444; font-weight: bold; }
            .action-button { background: linear-gradient(to right, #991b1b, #b45309); color: white; padding: 12px 24px; text-decoration: none; border-radius: 5px; display: inline-block; margin: 10px 0; }
            .testro-logo { font-size: 24px; font-weight: bold; background: linear-gradient(to right, #fbbf24, #f59e0b); -webkit-background-clip: text; -webkit-text-fill-color: transparent; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1 class="testro-logo">TESTRO BOOSTER</h1>
              <h2 style="color: white; margin: 10px 0;">New Order Alert</h2>
            </div>
            <div class="content">
              <div class="alert">
                <strong>🚀 URGENT: NEW TESTRO BOOSTER ORDER!</strong><br>
                <span style="font-size: 14px;">Action Required: Process within 24 hours</span>
              </div>
              
              <div class="info-box">
                <h3 style="margin: 0; color: #fbbf24;">⚡ Order Summary</h3>
                <table style="width: 100%; margin-top: 10px;">
                  <tr>
                    <td><strong>Order Number:</strong></td>
                    <td class="urgent">${order.orderNumber}</td>
                  </tr>
                  <tr>
                    <td><strong>Customer:</strong></td>
                    <td class="highlight">${order.customerName}</td>
                  </tr>
                  <tr>
                    <td><strong>Email:</strong></td>
                    <td>${order.customerEmail}</td>
                  </tr>
                  <tr>
                    <td><strong>Phone:</strong></td>
                    <td>${order.customerPhone}</td>
                  </tr>
                  <tr>
                    <td><strong>Total Amount:</strong></td>
                    <td class="highlight" style="font-size: 20px;">${formatINR(order.totalAmount)}</td>
                  </tr>
                  <tr>
                    <td><strong>Payment Method:</strong></td>
                    <td>${order.paymentMethod === 'cod' ? '💰 Cash on Delivery' : 
                         order.paymentMethod === 'upi' ? '📱 UPI Payment' : 
                         order.paymentMethod === 'credit_card' ? '💳 Credit/Debit Card' : 
                         '🏦 Net Banking'}</td>
                  </tr>
                  <tr>
                    <td><strong>Order Date:</strong></td>
                    <td>${new Date(order.createdAt).toLocaleString('en-IN')}</td>
                  </tr>
                </table>
              </div>
              
              <h3 style="color: #fbbf24;">📦 Order Items</h3>
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
                  ${order.products.map(product => `
                    <tr>
                      <td>Testro Booster Capsule</td>
                      <td>${product.capsuleType}</td>
                      <td>${product.quantity}</td>
                      <td>${formatINR(product.price)}</td>
                      <td>${formatINR(product.quantity * product.price)}</td>
                    </tr>
                  `).join('')}
                </tbody>
              </table>
              
              <div class="info-box">
                <h3 style="margin: 0; color: #fbbf24;">📍 Shipping Details</h3>
                <p style="margin: 10px 0;">
                  <strong>Address:</strong><br>
                  ${order.shippingAddress.street}<br>
                  ${order.shippingAddress.city}, ${order.shippingAddress.state} ${order.shippingAddress.zipCode}<br>
                  ${order.shippingAddress.country}
                </p>
              </div>
              
              <div style="background-color: #1f2937; padding: 20px; border-radius: 10px; margin: 30px 0; border: 1px solid #374151;">
                <h3 style="color: #fbbf24; margin-top: 0;">📋 Next Steps (Process Immediately)</h3>
                <ol style="margin: 10px 0; padding-left: 20px;">
                  <li><strong>1.</strong> Confirm inventory for Testro Booster ${order.products[0].capsuleType}</li>
                  <li><strong>2.</strong> Process order within 24 hours</li>
                  <li><strong>3.</strong> Generate shipping label</li>
                  <li><strong>4.</strong> Update order status to "Processing"</li>
                  <li><strong>5.</strong> Send tracking information to customer</li>
                  <li><strong>6.</strong> Prepare Testro Booster package with care</li>
                </ol>
              </div>
              
              <div style="text-align: center; margin: 30px 0;">
                <a href="${process.env.ADMIN_DASHBOARD_URL || '#'}" class="action-button">
                  📊 View & Process Order in Dashboard
                </a>
                <p style="margin-top: 15px; font-size: 12px; color: #9ca3af;">
                  Estimated processing time: 30 minutes
                </p>
              </div>
              
              <div style="border-top: 1px solid #374151; padding-top: 20px; font-size: 12px; color: #9ca3af;">
                <p><strong>📈 Order Statistics:</strong></p>
                <ul style="margin: 5px 0; padding-left: 20px;">
                  <li>Order Value: ${formatINR(order.totalAmount)}</li>
                  <li>Customer Location: ${order.shippingAddress.city}, ${order.shippingAddress.state}</li>
                  <li>Product Type: Testro Booster ${order.products[0].capsuleType}</li>
                  <li>Quantity: ${order.products[0].quantity} ${order.products[0].quantity === 1 ? 'Bottle' : 'Bottles'}</li>
                </ul>
              </div>
              
              <p style="margin-top: 20px; font-size: 12px; color: #6b7280;">
                ⚡ This is an automated notification from Testro Booster Order System.
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