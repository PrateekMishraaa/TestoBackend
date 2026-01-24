import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import helmet from "helmet";
import morgan from "morgan";

import connectDB from "./config/database.js";
import orderRoutes from "./routes/orderRoutes.js";
import errorHandler from "./middleware/ErrorHandler.js";

dotenv.config();

const app = express();

/* ================================
   DATABASE
================================ */
connectDB();

/* ================================
   CORS CONFIG (FIXED)
================================ */
const allowedOrigins = [
  "https://testro-booster.vercel.app",
  process.env.CLIENT_URL
].filter(Boolean);

app.use(
  cors({
    origin: (origin, callback) => {
      // Allow server-to-server, Postman, Render health checks
      if (!origin) return callback(null, true);

      if (allowedOrigins.includes(origin)) {
        return callback(null, true);
      }

      // ❌ DO NOT throw error
      return callback(null, false);
    },
    credentials: true,
    methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization"]
  })
);

// 🔥 MUST HANDLE PREFLIGHT
app.options("*", cors());

/* ================================
   MIDDLEWARES
================================ */
app.use(helmet());
app.use(morgan("dev"));
app.use(express.json({ limit: "10mb" }));
app.use(express.urlencoded({ extended: true, limit: "10mb" }));

/* ================================
   ROUTES
================================ */
app.get("/", (req, res) => {
  res.json({
    success: true,
    message: "Testro Booster API",
    version: "1.0.0",
    status: "active",
    endpoints: {
      createOrder: "POST /api/orders",
      getOrder: "GET /api/orders/:orderNumber",
      health: "GET /health"
    }
  });
});

app.get("/health", (req, res) => {
  res.status(200).json({
    success: true,
    status: "healthy",
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
   ERROR HANDLER (LAST)
================================ */
app.use(errorHandler);

/* ================================
   SERVER
================================ */
const PORT = process.env.PORT || 4500;

app.listen(PORT, () => {
  console.log(`
🚀 Server running on port ${PORT}
🌍 Environment: ${process.env.NODE_ENV || "development"}
  `);
});

export default app;
