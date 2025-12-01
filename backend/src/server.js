import express from 'express';
import cors from 'cors';
import config from './config/index.js';
import prisma from './config/database.js';

// Import routes
import userRoutes from './routes/userRoutes.js';
import productRoutes from './routes/productRoutes.js';
import orderRoutes from './routes/orderRoutes.js';
import vipRoutes from './routes/vipRoutes.js';

const app = express();

// Middleware
app.use(cors(config.cors));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Request logging middleware
app.use((req, res, next) => {
  console.log(`${new Date().toISOString()} - ${req.method} ${req.path}`);
  next();
});

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    environment: config.nodeEnv
  });
});

// API routes
app.use('/api/user', userRoutes);
app.use('/api/users', userRoutes);
app.use('/api/products', productRoutes);
app.use('/api/ribao', productRoutes); // Alias for ribao/list
app.use('/api/orders', orderRoutes);
app.use('/api/vip', vipRoutes);

// 404 handler
app.use((req, res) => {
  res.status(404).json({
    code: 0,
    msg: 'Endpoint not found',
    data: null
  });
});

// Error handler
app.use((err, req, res, _next) => {
  console.error('Server error:', err);
  res.status(500).json({
    code: 0,
    msg: 'Internal server error',
    data: null
  });
});

// Graceful shutdown
const gracefulShutdown = async () => {
  console.log('Shutting down gracefully...');
  await prisma.$disconnect();
  process.exit(0);
};

process.on('SIGTERM', gracefulShutdown);
process.on('SIGINT', gracefulShutdown);

// Start server
app.listen(config.port, () => {
  console.log(`
╔════════════════════════════════════════════════════════╗
║           CSOL Backend Service Started                 ║
╠════════════════════════════════════════════════════════╣
║  Port:        ${config.port}                                    ║
║  Environment: ${config.nodeEnv.padEnd(28)}║
║  API Base:    http://localhost:${config.port}/api               ║
╚════════════════════════════════════════════════════════╝
  `);
});

export default app;
