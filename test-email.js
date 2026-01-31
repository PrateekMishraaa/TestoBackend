import dotenv from 'dotenv';
dotenv.config();

import nodemailer from 'nodemailer';

async function testGmailConnection() {
  console.log('🔍 Testing Gmail SMTP Connection...');
  console.log('SMTP_USER:', process.env.SMTP_USER);
  console.log('SMTP_PASS exists:', !!process.env.SMTP_PASS);
  
  try {
    // Create transporter
    const transporter = nodemailer.createTransport({
      host: 'smtp.gmail.com',
      port: 465,
      secure: true, // true for 465, false for other ports
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS,
      },
      debug: true,
      logger: true
    });

    // Verify connection
    console.log('🔗 Verifying SMTP connection...');
    await transporter.verify();
    console.log('✅ SMTP Connection verified successfully!');

    // Send test email
    console.log('📧 Sending test email...');
    const info = await transporter.sendMail({
      from: `"Testro Booster Test" <${process.env.SMTP_USER}>`,
      to: process.env.SMTP_USER, // Send to yourself
      subject: '✅ Testro Booster Email Test - SUCCESS',
      text: 'This is a test email from Testro Booster system.',
      html: `
        <div style="font-family: Arial, sans-serif; padding: 20px; background-color: #f4f4f4;">
          <div style="max-width: 600px; margin: 0 auto; background: white; padding: 30px; border-radius: 10px; box-shadow: 0 0 10px rgba(0,0,0,0.1);">
            <h1 style="color: #4CAF50; text-align: center;">🎉 Testro Booster Email Test Successful!</h1>
            <div style="text-align: center; margin: 20px 0;">
              <div style="background-color: #4CAF50; color: white; width: 50px; height: 50px; line-height: 50px; border-radius: 50%; display: inline-block; font-size: 24px;">
                ✓
              </div>
            </div>
            <p>Hello,</p>
            <p>This is a test email to confirm that your Testro Booster email system is working correctly.</p>
            <p><strong>Server Time:</strong> ${new Date().toLocaleString()}</p>
            <p><strong>SMTP Status:</strong> <span style="color: #4CAF50;">Connected and Working</span></p>
            <hr style="margin: 20px 0;">
            <p style="font-size: 12px; color: #666;">
              If you received this email, your email configuration is correct. You can now receive order confirmation emails.
            </p>
          </div>
        </div>
      `
    });

    console.log('✅ Test email sent successfully!');
    console.log('📨 Message ID:', info.messageId);
    console.log('📧 To:', info.envelope.to);
    console.log('📧 From:', info.envelope.from);
    console.log('🔗 Preview URL:', nodemailer.getTestMessageUrl(info));

  } catch (error) {
    console.error('❌ Error Details:');
    console.error('- Message:', error.message);
    console.error('- Code:', error.code);
    console.error('- Command:', error.command);
    
    if (error.code === 'EAUTH') {
      console.error('\n🔐 Authentication Failed! Common issues:');
      console.error('1. Make sure 2-Step Verification is ON in Google Account');
      console.error('2. Use App Password (not your regular password)');
      console.error('3. Check if "Less secure apps" is enabled (if using password)');
      console.error('4. App Password: ' + process.env.SMTP_PASS);
    }
    
    if (error.code === 'ECONNECTION') {
      console.error('\n🌐 Connection Failed! Try:');
      console.error('1. Change port to 587 and secure: false');
      console.error('2. Check firewall settings');
      console.error('3. Try different network');
    }
  }
}

// Run the test
testGmailConnection();