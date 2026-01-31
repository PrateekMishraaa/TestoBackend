import nodemailer from 'nodemailer';

// SUPER SIMPLE FIX
const SMTP_USER = 'anshvedaofficiall0052@gmail.com';
const SMTP_PASS = 'trwr myvb fcff kpud';

console.log('📧 Using hardcoded credentials:');
console.log('- User:', SMTP_USER);
console.log('- Pass:', SMTP_PASS.substring(0, 4) + '***');

export const emailConfig = {
  host: 'smtp.gmail.com',
  port: 465,
  secure: true,
  auth: { user: SMTP_USER, pass: SMTP_PASS },
  from: `"Testro Booster" <${SMTP_USER}>`,
  admin: SMTP_USER
};

export const isEmailConfigured = () => {
  console.log('📧 isEmailConfigured: TRUE (hardcoded)');
  return true;
};

export const getEmailConfigStatus = () => {
  console.log('📧 getEmailConfigStatus called');
  return {
    configured: true,
    host: 'smtp.gmail.com',
    port: 465,
    secure: true,
    user: 'ans***',
    from: `"Testro Booster" <${SMTP_USER}>`,
    admin: SMTP_USER
  };
};

const createTransporter = () => {
  console.log('📧 Creating transporter...');
  return nodemailer.createTransport({
    host: 'smtp.gmail.com',
    port: 465,
    secure: true,
    auth: { user: SMTP_USER, pass: SMTP_PASS },
    debug: true,
    logger: true
  });
};

export const testEmailConnection = async () => {
  try {
    const transporter = createTransporter();
    await transporter.verify();
    console.log('✅ SMTP Connection successful');
    return { success: true, message: 'Connected' };
  } catch (error) {
    console.error('❌ Connection failed:', error.message);
    return { success: false, message: error.message };
  }
};

export const sendTestEmail = async () => {
  try {
    const transporter = createTransporter();
    const info = await transporter.sendMail({
      from: emailConfig.from,
      to: SMTP_USER,
      subject: 'Test Email',
      text: 'Test email from Testro Booster'
    });
    console.log('✅ Test email sent:', info.messageId);
    return { success: true, messageId: info.messageId };
  } catch (error) {
    console.error('❌ Error:', error.message);
    return { success: false, message: error.message };
  }
};

export const sendOrderConfirmationEmail = async (order) => {
  try {
    const transporter = createTransporter();
    const info = await transporter.sendMail({
      from: emailConfig.from,
      to: order.customerEmail,
      subject: `Order Confirmation - ${order.orderNumber}`,
      text: `Thank you for your order ${order.orderNumber}`
    });
    return { success: true, messageId: info.messageId };
  } catch (error) {
    return { success: false, message: error.message };
  }
};

export const sendAdminNotificationEmail = async (order) => {
  try {
    const transporter = createTransporter();
    const info = await transporter.sendMail({
      from: emailConfig.from,
      to: emailConfig.admin,
      subject: `New Order - ${order.orderNumber}`,
      text: `New order received: ${order.orderNumber}`
    });
    return { success: true, messageId: info.messageId };
  } catch (error) {
    return { success: false, message: error.message };
  }
};