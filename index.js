import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import helmet from 'helmet';
import morgan from 'morgan';

dotenv.config();

import connectDB from './config/database.js';
import orderRoutes from './routes/orderRoutes.js';
import  errorHandler  from './middleware/ErrorHandler.js'; // Make sure this matches!

const app = express();

// Connect to database
connectDB();

// CORS Configuration
const allowedOrigins = [
  'https://testro-booster.vercel.app',
  'https://testro-booster.vercel.app',
  process.env.CLIENT_URL
].filter(Boolean);

app.use(cors({
  origin: function (origin, callback) {
    if (!origin || allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));

app.use(helmet());
app.use(morgan('dev'));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Routes
app.get('/', (req, res) => {
  res.json({
    success: true,
    message: 'Testro Booster API',
    version: '1.0.0',
    status: 'active',
    documentation: {
      createOrder: 'POST /api/orders',
      getOrder: 'GET /api/orders/:orderNumber',
      health: 'GET /health'
    }
  });
});

app.get('/health', (req, res) => {
  res.status(200).json({
    success: true,
    status: 'healthy',
    timestamp: new Date().toISOString(),
    service: 'Testro Booster API'
  });
});

app.use('/api/orders', orderRoutes);

// 404 handler
app.use((req, res, next) => {
  res.status(404).json({
    success: false,
    message: `Route ${req.originalUrl} not found`,
    error: 'NOT_FOUND'
  });
});

// Error handler - THIS MUST BE LAST
app.use(errorHandler);

const PORT = process.env.PORT || 4500;

app.listen(PORT, () => {
  console.log(`
🚀 Server started on port ${PORT}
🌍 Environment: ${process.env.NODE_ENV || 'development'}
🔗 API: http://localhost:${PORT}
  `);
});

export default app;