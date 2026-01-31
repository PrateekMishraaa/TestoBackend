import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import helmet from "helmet";
import morgan from "morgan";
import mongoose from "mongoose";
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

// ES Modules में __dirname बनाने के लिए
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// ========== सबसे IMPORTANT: पहले dotenv.config() call करें ==========
// सही path के साथ .env फाइल load करें
dotenv.config({ path: join(__dirname, '.env') });

// DEBUG: Environment variables check IMMEDIATELY
console.log("🔍 Environment Variables Check (AT START):");
console.log("- NODE_ENV:", process.env.NODE_ENV);
console.log("- PORT:", process.env.PORT);
console.log("- MONGODB_URI:", process.env.MONGODB_URI ? "✓ Set" : "✗ Not set");
console.log("- SMTP_USER:", process.env.SMTP_USER || "✗ Not set");
console.log("- SMTP_PASS:", process.env.SMTP_PASS ? "✓ Set (hidden)" : "✗ Not set");
console.log("- CLIENT_URL:", process.env.CLIENT_URL || "✗ Not set");

// Import routes and middleware
import orderRoutes from "./routes/orderRoutes.js";
import errorHandler from "./middleware/ErrorHandler.js";

const app = express();

/* ================================
   DATABASE CONNECTION
================================ */
const connectDB = async () => {
  try {
    const mongoURI = process.env.MONGODB_URI;
    
    if (!mongoURI) {
      throw new Error("MongoDB URI not found in environment variables");
    }
    
    console.log("\n🔗 Connecting to MongoDB...");
    
    await mongoose.connect(mongoURI, {
      serverSelectionTimeoutMS: 10000,
      socketTimeoutMS: 45000,
    });
    
    console.log(`✅ MongoDB Connected: ${mongoose.connection.host}`);
    
  } catch (error) {
    console.error("\n❌ MongoDB Connection Error:", error.message);
    console.error("💡 Make sure MONGODB_URI is set correctly in environment variables");
    process.exit(1);
  }
};

// Connect to database
await connectDB();

/* ================================
   CORS CONFIG
================================ */
const allowedOrigins = [
  "https://anshveda.in",
  "http://localhost:5173",
  "http://localhost:3000",
  "http://localhost:5000",
  process.env.CLIENT_URL,
  process.env.ADMIN_DASHBOARD_URL
].filter(Boolean);

console.log("\n🌐 Allowed CORS Origins:", allowedOrigins);

app.use(
  cors({
    origin: function (origin, callback) {
      // Allow requests with no origin
      if (!origin) return callback(null, true);
      
      if (allowedOrigins.indexOf(origin) === -1) {
        const msg = `CORS blocked: ${origin}`;
        console.warn('CORS Blocked:', origin);
        return callback(new Error(msg), false);
      }
      return callback(null, true);
    },
    credentials: true,
    methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS", "PATCH"],
    allowedHeaders: ["Content-Type", "Authorization", "X-Requested-With"]
  })
);

// Handle preflight requests
app.options('*', cors());

/* ================================
   SECURITY & PARSERS
================================ */
app.use(helmet());
app.use(morgan("dev"));
app.use(express.json({ limit: "10mb" }));
app.use(express.urlencoded({ extended: true, limit: "10mb" }));

/* ================================
   ROUTES
================================ */
app.get("/", (req, res) => {
  res.status(200).json({
    success: true,
    message: "Testro Booster API is running 🚀",
    environment: process.env.NODE_ENV || "development",
    version: "1.0.0",
    timestamp: new Date().toISOString()
  });
});

app.get("/health", async (req, res) => {
  try {
    const dbStatus = mongoose.connection.readyState === 1 ? "connected" : "disconnected";
    
    // Dynamic import for email config to avoid circular dependencies
    const { getEmailConfigStatus } = await import('./services/emailService.js');
    const emailConfig = getEmailConfigStatus();
    
    res.status(200).json({
      success: true,
      status: "healthy",
      database: dbStatus,
      email: emailConfig.configured ? "configured" : "not configured",
      uptime: process.uptime(),
      timestamp: new Date().toISOString(),
      emailDetails: {
        user: emailConfig.user,
        host: emailConfig.host,
        port: emailConfig.port
      }
    });
  } catch (error) {
    res.status(200).json({
      success: true,
      status: "healthy",
      database: mongoose.connection.readyState === 1 ? "connected" : "disconnected",
      email: "error checking",
      uptime: process.uptime(),
      timestamp: new Date().toISOString(),
      error: error.message
    });
  }
});

// Email test endpoint
app.get("/api/test-email", async (req, res) => {
  try {
    const { sendTestEmail, testEmailConnection, getEmailConfigStatus } = await import('./services/emailService.js');
    
    const config = getEmailConfigStatus();
    
    console.log("📧 Email Config in test endpoint:", config);
    
    if (!config.configured) {
      return res.status(400).json({
        success: false,
        message: 'Email not configured. Check .env file.',
        config,
        envCheck: {
          SMTP_USER: process.env.SMTP_USER || "Not set",
          SMTP_PASS: process.env.SMTP_PASS ? "Set" : "Not set"
        }
      });
    }

    // Test connection
    const connectionResult = await testEmailConnection();
    
    if (!connectionResult.success) {
      return res.status(500).json({
        success: false,
        message: 'SMTP connection failed',
        error: connectionResult.message,
        config
      });
    }

    // Send test email
    const emailResult = await sendTestEmail();
    
    res.json({
      success: emailResult.success,
      message: emailResult.success ? 'Test email sent successfully' : 'Failed to send test email',
      details: emailResult,
      config
    });
    
  } catch (error) {
    console.error("Error in test-email endpoint:", error);
    res.status(500).json({
      success: false,
      message: 'Error testing email',
      error: error.message,
      stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
    });
  }
});

// Email config endpoint
app.get("/api/email-config", async (req, res) => {
  try {
    const { getEmailConfigStatus } = await import('./services/emailService.js');
    const config = getEmailConfigStatus();
    
    // Also show raw env variables (safely)
    const envInfo = {
      SMTP_USER: process.env.SMTP_USER || "Not set",
      SMTP_PASS: process.env.SMTP_PASS ? "Set" : "Not set",
      SMTP_HOST: process.env.SMTP_HOST || "Not set",
      SMTP_PORT: process.env.SMTP_PORT || "Not set"
    };
    
    res.json({
      success: true,
      config,
      envInfo,
      message: config.configured ? 
        'Email is configured correctly' : 
        'Email configuration incomplete. Check .env file'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error getting email config',
      error: error.message
    });
  }
});

// Direct email test endpoint (simplified)
app.get("/api/direct-test", async (req, res) => {
  try {
    const nodemailer = await import('nodemailer');
    
    // Direct test without using emailService
    const transporter = nodemailer.default.createTransport({
      host: process.env.SMTP_HOST || 'smtp.gmail.com',
      port: parseInt(process.env.SMTP_PORT) || 465,
      secure: true,
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS
      },
      debug: true,
      logger: true
    });

    // Verify connection
    await transporter.verify();
    
    // Send test email
    const info = await transporter.sendMail({
      from: `"Direct Test" <${process.env.SMTP_USER}>`,
      to: process.env.SMTP_USER,
      subject: 'Direct Email Test',
      text: 'This is a direct test email from the server.',
      html: '<h2>Direct Test Successful</h2><p>If you see this, email is working!</p>'
    });

    res.json({
      success: true,
      message: 'Direct test email sent successfully',
      messageId: info.messageId,
      env: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS ? '***' + process.env.SMTP_PASS.slice(-4) : 'Not set',
        host: process.env.SMTP_HOST,
        port: process.env.SMTP_PORT
      }
    });
    
  } catch (error) {
    console.error('Direct test error:', error);
    res.status(500).json({
      success: false,
      message: 'Direct test failed',
      error: error.message,
      code: error.code,
      env: {
        SMTP_USER: process.env.SMTP_USER || 'Not set',
        SMTP_PASS: process.env.SMTP_PASS ? 'Set' : 'Not set'
      }
    });
  }
});

app.use("/api/orders", orderRoutes);

/* ================================
   404 HANDLER
================================ */
app.use((req, res) => {
  res.status(404).json({
    success: false,
    message: `Route ${req.originalUrl} not found`,
    availableEndpoints: [
      "GET /",
      "GET /health",
      "GET /api/test-email",
      "GET /api/email-config",
      "GET /api/direct-test",
      "POST /api/orders",
      "GET /api/orders",
      "GET /api/orders/:orderNumber",
      "PUT /api/orders/:orderNumber/status"
    ]
  });
});

/* ================================
   ERROR HANDLER
================================ */
app.use(errorHandler);

/* ================================
   SERVER
================================ */
const PORT = process.env.PORT || 5000;

const server = app.listen(PORT, '0.0.0.0', () => {
  console.log(`\n✅ Server running on port ${PORT}`);
  console.log(`📍 Environment: ${process.env.NODE_ENV || "development"}`);
  console.log(`🔗 Local URL: http://localhost:${PORT}`);
  console.log(`🔗 Health endpoint: http://localhost:${PORT}/health`);
  console.log(`📧 Email test: http://localhost:${PORT}/api/test-email`);
  console.log(`📧 Direct test: http://localhost:${PORT}/api/direct-test\n`);
});

/* ================================
   GRACEFUL SHUTDOWN
================================ */
process.on("SIGTERM", () => {
  console.log("🛑 SIGTERM received. Shutting down gracefully...");
  server.close(() => {
    console.log("✅ Server closed.");
    mongoose.connection.close();
    process.exit(0);
  });
});

// Handle uncaught exceptions
process.on('uncaughtException', (error) => {
  console.error('❌ Uncaught Exception:', error);
});

process.on('unhandledRejection', (reason, promise) => {
  console.error('❌ Unhandled Rejection at:', promise, 'reason:', reason);
});