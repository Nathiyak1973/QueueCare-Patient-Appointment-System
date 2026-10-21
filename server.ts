import http from 'http';
import path from 'path';
import express, { Request, Response, NextFunction } from 'express';
import cors from 'cors';
import { Server as SocketIOServer } from 'socket.io';
import dotenv from 'dotenv';
import { connectDB } from './server/config/db.ts';
import { setSocketIOInstance } from './server/services/socketService.ts';

// Routers
import authRoutes from './server/routes/authRoutes.ts';
import doctorRoutes from './server/routes/doctorRoutes.ts';
import appointmentRoutes from './server/routes/appointmentRoutes.ts';
import queueRoutes from './server/routes/queueRoutes.ts';
import dashboardRoutes from './server/routes/dashboardRoutes.ts';
import adminRoutes from './server/routes/adminRoutes.ts';
import notificationRoutes from './server/routes/notificationRoutes.ts';
import paymentRoutes from './server/routes/paymentRoutes.ts';

dotenv.config();

const app = express();
const server = http.createServer(app);

// Initialize Socket.IO with CORS
export const io = new SocketIOServer(server, {
  cors: {
    origin: '*',
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE'],
  },
});

setSocketIOInstance(io);

io.on('connection', (socket) => {
  socket.on('join_doctor_queue', (doctorId: string) => {
    socket.join(`queue_${doctorId}`);
  });

  socket.on('leave_doctor_queue', (doctorId: string) => {
    socket.leave(`queue_${doctorId}`);
  });
});

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// API Routes
app.use('/api/auth', authRoutes);
app.use('/api/doctors', doctorRoutes);
app.use('/api/appointments', appointmentRoutes);
app.use('/api/queue', queueRoutes);
app.use('/api/dashboard', dashboardRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/notifications', notificationRoutes);
app.use('/api/payments', paymentRoutes);

// Health check endpoint
app.get('/api/health', (_req: Request, res: Response) => {
  res.json({
    status: 'ok',
    system: 'CareQueue Hospital Queue Management System',
    timestamp: new Date().toISOString(),
  });
});

// Global API error handler
app.use((err: Error, _req: Request, res: Response, _next: NextFunction) => {
  console.error('[API Error]:', err.stack || err.message);
  res.status(500).json({
    success: false,
    message: err.message || 'Internal server error occurred.',
  });
});

// Mount Vite or serve static assets
const PORT = process.env.PORT ? parseInt(process.env.PORT, 10) : 3000;

async function startServer() {
  await connectDB();

  const isProduction = process.env.NODE_ENV === 'production';

  if (!isProduction) {
    const { createServer: createViteServer } = await import('vite');
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
    console.log('[Server] Vite middleware integrated into Express dev server.');
  } else {
    const distPath = path.resolve(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (_req, res) => {
      res.sendFile(path.resolve(distPath, 'index.html'));
    });
  }

  server.listen(PORT, '0.0.0.0', () => {
    console.log(`[Server] CareQueue Hospital System running on http://0.0.0.0:${PORT}`);
  });
}

startServer().catch((err) => {
  console.error('[Fatal] Failed to start server:', err);
});
