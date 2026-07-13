import express from 'express';
import cors from 'cors';
import path from 'path';
import http from 'http';
import { Server as SocketIOServer } from 'socket.io';
import { env } from './config/env';
import { startup } from './config/startup';
import authRoutes from './routes/auth.routes';
import businessRoutes from './routes/business.routes';
import webhookRoutes from './routes/webhook.routes';
import paymentRoutes from './routes/payment.routes';
import locationRoutes from './routes/location.routes';
import adminRoutes from './routes/admin.routes';
import { expireOverdueSubscriptions } from './services/subscription.service';

const app = express();
const server = http.createServer(app);

process.on('unhandledRejection', (reason) => { console.error('UNHANDLED REJECTION:', reason); });
process.on('uncaughtException', (err) => { console.error('UNCAUGHT EXCEPTION:', err); });

const io = new SocketIOServer(server, {
  cors: { origin: env.CORS_ORIGIN, methods: ['GET', 'POST'] },
});

// Middleware
app.use(cors({ origin: env.CORS_ORIGIN }));
app.use(express.json());
app.use((req, _res, next) => { console.log(`${new Date().toISOString()} ${req.method} ${req.url} from ${req.ip}`); next(); });

// Make io accessible to controllers
app.set('io', io);

// Serve admin web dashboard
app.use('/admin', express.static(path.join(__dirname, '../public/admin')));

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/businesses', businessRoutes);
app.use('/api/location', locationRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/webhooks', webhookRoutes);
app.use('/api/payments', paymentRoutes);

// Health check
app.get('/api/health', (_req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Socket.IO connection handling
io.on('connection', (socket) => {
  console.log(`Client connected: ${socket.id}`);

  socket.on('join', (userId: string) => {
    socket.join(`user:${userId}`);
    console.log(`Socket ${socket.id} joined user:${userId}`);
  });

  socket.on('disconnect', () => {
    console.log(`Client disconnected: ${socket.id}`);
  });
});

// Emit nearby business notification to specific user
export function emitNearbyBusiness(userId: string, business: any) {
  io.to(`user:${userId}`).emit('business_nearby', business);
}

// Periodic cleanup of expired subscriptions (every hour)
setInterval(async () => {
  try {
    await expireOverdueSubscriptions();
  } catch (err) {
    console.error('Error expiring subscriptions:', err);
  }
}, 60 * 60 * 1000);

// Run startup then listen
startup()
  .then(() => {
    server.listen(env.PORT, () => {
      console.log(`IMAPLACE API running on port ${env.PORT}`);
    });
  })
  .catch((err) => {
    console.error('Startup failed:', err);
    process.exit(1);
  });

export default app;
