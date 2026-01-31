import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import helmet from "helmet";
import morgan from "morgan";
import mongoose from "mongoose";

// Import routes and middleware
import orderRoutes from "./routes/orderRoutes.js";
import errorHandler from "./middleware/ErrorHandler.js";

dotenv.config();

const app = express();

/* ================================
   DEBUG: Environment check
================================ */
console.log("🔍 Environment Check:");
console.log("- NODE_ENV:", process.env.NODE_ENV || "development");
console.log("- PORT:", process.env.PORT);
console.log(process.env.PORT,"this is port")
console.log("- MONGODB_URI exists:", !!process.env.MONGODB_URI);
console.log("- CLIENT_URL:", process.env.CLIENT_URL);

/* ================================
   DATABASE CONNECTION
================================ */
const connectDB = async () => {
  try {
    const mongoURI = process.env.MONGODB_URI || process.env.MONGO_URI;
    
    if (!mongoURI) {
      throw new Error("MongoDB URI not found in environment variables");
    }
    
    console.log("🔗 Connecting to MongoDB...");
    await mongoose.connect(mongoURI, {
      serverSelectionTimeoutMS: 10000,
      socketTimeoutMS: 45000,
    });
    
    console.log(`✅ MongoDB Connected: ${mongoose.connection.host}`);
    console.log("uri",process.env.MONGODB_URI)
  } catch (error) {
    console.error("❌ MongoDB Connection Error:", error.message);
    console.error("💡 Make sure MONGODB_URI is set in Render environment variables");
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
  "http://localhost:3000",
  process.env.CLIENT_URL
].filter(Boolean);

app.use(
  cors({
    origin: allowedOrigins,
    credentials: true,
    methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization"]
  })
);

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
    environment: process.env.NODE_ENV || "development"
  });
});

app.get("/health", (req, res) => {
  res.status(200).json({
    success: true,
    status: "healthy",
    database: mongoose.connection.readyState === 1 ? "connected" : "disconnected",
    timestamp: new Date().toISOString()
  });
});

app.use("/api/orders", orderRoutes);

/* ================================
   404 HANDLER
================================ */
app.use((req, res) => {
  res.status(404).json({
    success: false,
    message: `Route ${req.originalUrl} not found`
  });
});

/* ================================
   ERROR HANDLER
================================ */
app.use(errorHandler);

/* ================================
   SERVER
================================ */
const PORT = process.env.PORT || 4500;

const server = app.listen(PORT, () => {
  console.log(`\n✅ Server running on port ${PORT}`);
  console.log(`📍 Environment: ${process.env.NODE_ENV || "development"}`);
  console.log(`🔗 Health endpoint: http://localhost:${PORT}/health\n`);
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