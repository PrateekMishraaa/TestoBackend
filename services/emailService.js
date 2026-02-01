import nodemailer from 'nodemailer';

// 🔧 HARDCODED CREDENTIALS (Don't change these)
const SMTP_USER = 'anshvedaofficiall0052@gmail.com';
const SMTP_PASS = 'trwr myvb fcff kpud';

export const emailConfig = {
  host: 'smtp.gmail.com',
  port: 465,
  secure: true,
  auth: { user: SMTP_USER, pass: SMTP_PASS },
  from: `"Testro Booster" <${SMTP_USER}>`,
  admin: SMTP_USER
};

let transporter = null;

// 🚀 Create transporter once (singleton pattern)
const getTransporter = () => {
  if (!transporter) {
    console.log('📧 Creating nodemailer transporter...');
    transporter = nodemailer.createTransport({
      host: emailConfig.host,
      port: emailConfig.port,
      secure: emailConfig.secure,
      auth: emailConfig.auth,
      // ⚡ Performance optimizations
      pool: true,
      maxConnections: 5,
      maxMessages: 50,
      rateDelta: 1000,
      rateLimit: 5
    });
  }
  return transporter;
};

// 📤 Send email without blocking
const sendEmailAsync = async (mailOptions) => {
  try {
    const transporter = getTransporter();
    const info = await transporter.sendMail(mailOptions);
    console.log(`✅ Email sent: ${info.messageId}`);
    return { success: true, messageId: info.messageId };
  } catch (error) {
    console.error(`❌ Email error: ${error.message}`);
    // Don't throw, just log
    return { success: false, message: error.message };
  }
};

// 🔄 Test connection
export const testEmailConnection = async () => {
  try {
    const transporter = getTransporter();
    await transporter.verify();
    console.log('✅ SMTP Connection successful');
    return { success: true, message: 'Connected' };
  } catch (error) {
    console.error('❌ Connection failed:', error.message);
    return { success: false, message: error.message };
  }
};

// ✉️ Send test email
export const sendTestEmail = async () => {
  return sendEmailAsync({
    from: emailConfig.from,
    to: SMTP_USER,
    subject: 'Test Email - Testro Booster',
    text: 'This is a test email from Testro Booster API',
    html: `<h3>Test Email</h3><p>This is a test email from Testro Booster API</p>`
  });
};

// 📝 Generate order confirmation HTML
const generateOrderEmailContent = (order) => {
  const orderDate = new Date(order.createdAt).toLocaleDateString('en-IN', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  });

  return {
    subject: `✅ Order Confirmed - ${order.orderNumber}`,
    
    text: `
Order Confirmation - Testro Booster
===================================

Thank you for your order!

ORDER DETAILS:
Order Number: ${order.orderNumber}
Order Date: ${orderDate}
Customer: ${order.customerName}
Email: ${order.customerEmail}
Phone: ${order.customerPhone}

PRODUCTS:
${order.products.map(p => 
  `${p.name} (${p.capsuleType}) x ${p.quantity} - ₹${p.price * p.quantity}`
).join('\n')}

PRICE SUMMARY:
Subtotal: ₹${order.subtotal}
Tax: ₹${order.tax}
Shipping: ₹${order.shippingFee}
Total: ₹${order.totalAmount}

Shipping Address: ${order.shippingAddress.street}, ${order.shippingAddress.city}, ${order.shippingAddress.state} - ${order.shippingAddress.zipCode}

Payment Method: ${order.paymentMethod}
Order Status: ${order.orderStatus}

We'll process your order soon and update you on shipping.
For any queries, reply to this email.

Thank you!
Testro Booster Team
    `,
    
    html: `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Order Confirmation</title>
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; line-height: 1.6; color: #333; background: #f5f5f5; }
    .container { max-width: 600px; margin: 0 auto; background: white; }
    .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 30px 20px; text-align: center; }
    .content { padding: 30px; }
    .section { margin: 25px 0; padding: 20px; background: #f8f9fa; border-radius: 8px; border-left: 4px solid #667eea; }
    .order-number { font-size: 24px; font-weight: bold; color: #764ba2; margin: 10px 0; }
    table { width: 100%; border-collapse: collapse; margin: 15px 0; }
    th { background: #667eea; color: white; padding: 12px; text-align: left; }
    td { padding: 12px; border-bottom: 1px solid #ddd; }
    .total-row { font-weight: bold; background: #e8f4fd; }
    .status-badge { display: inline-block; padding: 5px 15px; background: #10b981; color: white; border-radius: 20px; font-size: 14px; }
    .footer { text-align: center; padding: 20px; background: #f1f1f1; color: #666; font-size: 14px; }
    @media (max-width: 600px) { .content { padding: 15px; } }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>🎉 Order Confirmed!</h1>
      <p>Thank you for your purchase</p>
    </div>
    
    <div class="content">
      <div class="section">
        <h2>Order Details</h2>
        <div class="order-number">${order.orderNumber}</div>
        <p><strong>Date:</strong> ${orderDate}</p>
        <p><strong>Status:</strong> <span class="status-badge">${order.orderStatus}</span></p>
      </div>
      
      <div class="section">
        <h2>Customer Information</h2>
        <p><strong>Name:</strong> ${order.customerName}</p>
        <p><strong>Email:</strong> ${order.customerEmail}</p>
        <p><strong>Phone:</strong> ${order.customerPhone}</p>
        <p><strong>Shipping Address:</strong><br>
        ${order.shippingAddress.street}<br>
        ${order.shippingAddress.city}, ${order.shippingAddress.state} ${order.shippingAddress.zipCode}<br>
        ${order.shippingAddress.country}
        </p>
      </div>
      
      <div class="section">
        <h2>Order Items</h2>
        <table>
          <thead>
            <tr>
              <th>Product</th>
              <th>Type</th>
              <th>Qty</th>
              <th>Price</th>
            </tr>
          </thead>
          <tbody>
            ${order.products.map(p => `
              <tr>
                <td>${p.name}</td>
                <td>${p.capsuleType}</td>
                <td>${p.quantity}</td>
                <td>₹${p.price * p.quantity}</td>
              </tr>
            `).join('')}
          </tbody>
        </table>
      </div>
      
      <div class="section">
        <h2>Price Summary</h2>
        <table>
          <tr><td>Subtotal</td><td>₹${order.subtotal}</td></tr>
          <tr><td>Tax</td><td>₹${order.tax}</td></tr>
          <tr><td>Shipping</td><td>₹${order.shippingFee}</td></tr>
          <tr class="total-row"><td>Total Amount</td><td>₹${order.totalAmount}</td></tr>
        </table>
        <p><strong>Payment Method:</strong> ${order.paymentMethod}</p>
      </div>
      
      <div class="section">
        <h2>What's Next?</h2>
        <p>✅ Order received and confirmed</p>
        <p>⏳ We'll process your order within 24 hours</p>
        <p>📦 You'll receive shipping updates via email</p>
        <p>📞 Our support team will contact you if needed</p>
      </div>
    </div>
    
    <div class="footer">
      <p>Need help? Reply to this email or contact support@testrobooster.com</p>
      <p>© ${new Date().getFullYear()} Testro Booster. All rights reserved.</p>
    </div>
  </div>
</body>
</html>
    `
  };
};

// 🚀 Send order confirmation (NON-BLOCKING)
export const sendOrderConfirmationEmail = async (order) => {
  try {
    const content = generateOrderEmailContent(order);
    
    const mailOptions = {
      from: emailConfig.from,
      to: order.customerEmail,
      subject: content.subject,
      text: content.text,
      html: content.html,
      // Priority headers
      headers: {
        'X-Priority': '1',
        'X-MSMail-Priority': 'High',
        'Importance': 'high'
      }
    };

    // Send email without waiting (fire and forget)
    setTimeout(async () => {
      try {
        const result = await sendEmailAsync(mailOptions);
        console.log(`📧 Order email ${result.success ? 'sent' : 'failed'} to ${order.customerEmail}`);
      } catch (err) {
        console.error('Background email error:', err.message);
      }
    }, 100); // Small delay to not block response

    return { success: true, message: 'Email queued for sending' };
  } catch (error) {
    console.error('Email generation error:', error.message);
    return { success: false, message: error.message };
  }
};

// 🚀 Send admin notification (NON-BLOCKING)
export const sendAdminNotificationEmail = async (order) => {
  try {
    const mailOptions = {
      from: emailConfig.from,
      to: emailConfig.admin,
      subject: `🛒 New Order #${order.orderNumber} - ₹${order.totalAmount}`,
      text: `
New Order Received!

Order #: ${order.orderNumber}
Customer: ${order.customerName}
Email: ${order.customerEmail}
Phone: ${order.customerPhone}
Total: ₹${order.totalAmount}
Items: ${order.products.length}
Time: ${new Date().toLocaleString()}
      `,
      html: `
<h3>🛒 New Order Received</h3>
<p><strong>Order #:</strong> ${order.orderNumber}</p>
<p><strong>Customer:</strong> ${order.customerName}</p>
<p><strong>Email:</strong> ${order.customerEmail}</p>
<p><strong>Phone:</strong> ${order.customerPhone}</p>
<p><strong>Total Amount:</strong> ₹${order.totalAmount}</p>
<p><strong>Items:</strong> ${order.products.length}</p>
<p><strong>Time:</strong> ${new Date().toLocaleString()}</p>
      `
    };

    // Send in background
    setTimeout(async () => {
      try {
        await sendEmailAsync(mailOptions);
        console.log('📧 Admin notification sent');
      } catch (err) {
        console.error('Background admin email error:', err.message);
      }
    }, 150);

    return { success: true, message: 'Admin notification queued' };
  } catch (error) {
    console.error('Admin email error:', error.message);
    return { success: false, message: error.message };
  }
};

export const isEmailConfigured = () => true;

export const getEmailConfigStatus = () => ({
  configured: true,
  host: 'smtp.gmail.com',
  port: 465,
  secure: true,
  user: 'ansh***@gmail.com',
  from: emailConfig.from,
  admin: emailConfig.admin
});