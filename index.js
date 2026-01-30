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
   CORS CONFIG
================================ */
const allowedOrigins = [
  "https://testro-booster.vercel.app",
  process.env.CLIENT_URL
].filter(Boolean);

app.use(
  cors({
    origin: (origin, callback) => {
      // Allow Postman / server-to-server / health checks
      if (!origin) return callback(null, true);

      if (allowedOrigins.includes(origin)) {
        return callback(null, true);
      }

      return callback(new Error("Not allowed by CORS"));
    },
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

app.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
});

export default app;
