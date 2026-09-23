const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const dotenv = require('dotenv');
const { createServer } = require('http');
const { Server } = require('socket.io');
const jwt = require('jsonwebtoken');
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
const { telemetrySchema } = require('./src/validators/api.validators');

dotenv.config();

const app = express();

// Security Headers
app.use(helmet());

// Strict CORS Configuration
app.use(cors({
  origin: process.env.CORS_ORIGIN || 'http://localhost:5173',
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));

// Restrict JSON Payload Size
app.use(express.json({ limit: '100kb' }));

const apiRoutes = require('./src/routes/api.routes');

// Health, Readiness & Liveness
app.get('/health', (req, res) => {
  res.json({ status: 'ok', service: 'PASHU-RAKSHA API', timestamp: new Date().toISOString() });
});

app.get('/readiness', (req, res) => {
  res.json({ status: 'ready', timestamp: new Date().toISOString() });
});

app.get('/liveness', (req, res) => {
  res.json({ status: 'alive', timestamp: new Date().toISOString() });
});

// Mount Production API Routes
app.use('/api', apiRoutes);

// Global Error Handler (Hides Internal Details)
app.use((err, req, res, next) => {
  // We can log the raw error in development/production logs
  console.error('[Global Error Handler]', err);

  // Zod Validation Error (if it bypassed the middleware somehow, though usually handled in middleware)
  if (err.name === 'ZodError') {
    return res.status(400).json({
      success: false,
      error: { code: 'VALIDATION_ERROR', message: 'Invalid request', details: err.errors }
    });
  }

  // Payload Too Large
  if (err.type === 'entity.too.large') {
    return res.status(413).json({
      success: false,
      error: { code: 'PAYLOAD_TOO_LARGE', message: 'Request body exceeds the 100kb limit' }
    });
  }

  // SyntaxError from express.json() for malformed JSON
  if (err instanceof SyntaxError && err.status === 400 && 'body' in err) {
    return res.status(400).json({
      success: false,
      error: { code: 'MALFORMED_JSON', message: 'Invalid JSON payload' }
    });
  }

  // Prisma Known Request Error (e.g. Unique constraint, Not Found)
  if (err.name === 'PrismaClientKnownRequestError') {
    return res.status(400).json({
      success: false,
      error: { code: 'DATABASE_ERROR', message: 'Database constraint or request error occurred' }
    });
  }

  // Generic unhandled exception shield
  res.status(500).json({
    success: false,
    error: { code: 'INTERNAL_SERVER_ERROR', message: 'An unexpected error occurred' }
  });
});

const httpServer = createServer(app);
const io = new Server(httpServer, {
  cors: { 
    origin: process.env.CORS_ORIGIN || 'http://localhost:5173',
    methods: ['GET', 'POST']
  }
});

// 1. Socket Authentication Middleware
io.use((socket, next) => {
  const token = socket.handshake.auth?.token || socket.handshake.headers?.authorization?.split(' ')[1];
  if (!token) {
    return next(new Error('Authentication error'));
  }
  jwt.verify(token, process.env.JWT_SECRET, (err, decoded) => {
    if (err) return next(new Error('Authentication error'));
    socket.user = { userId: decoded.userId, role: decoded.role };
    socket.tokenExp = decoded.exp;
    next();
  });
});

const socketRateLimits = new Map();

io.on('connection', (socket) => {
  console.log(`[PASHU-RAKSHA WS] Secure client connected: ${socket.id} (User: ${socket.user.userId} Role: ${socket.user.role})`);
  
  socketRateLimits.set(socket.id, { count: 0, lastReset: Date.now() });

  // 2. Room Join Authorization
  socket.on('join_room', async (payload) => {
    try {
      if (!payload || !payload.room) throw new Error('Room required');
      const parts = payload.room.split(':');
      if (parts.length !== 2) throw new Error('Invalid room format');
      const [type, resourceId] = parts;

      let authorized = false;

      if (type === 'farm') {
        if (socket.user.role === 'FARMER' || socket.user.role === 'FIELD_WORKER') {
          const farm = await prisma.farm.findUnique({ where: { id: resourceId } });
          if (farm && farm.ownerId === socket.user.userId) authorized = true;
        } else {
          // Admins, state/district officials can view any farm room
          authorized = true; 
        }
      } else if (type === 'district') {
        if (['ADMIN', 'STATE_OFFICIAL', 'DISTRICT_OFFICIAL'].includes(socket.user.role)) {
          authorized = true;
        }
      }

      if (authorized) {
        socket.join(payload.room);
        socket.emit('room_joined', { success: true, room: payload.room });
      } else {
        socket.emit('room_error', { success: false, error: 'Unauthorized to join room' });
      }
    } catch (err) {
      socket.emit('room_error', { success: false, error: err.message });
    }
  });

  // 3. Telemetry Input Validation & Verification
  socket.on('telemetry_stream', async (data) => {
    const limit = socketRateLimits.get(socket.id);
    if (Date.now() - limit.lastReset > 1000) {
      limit.count = 0;
      limit.lastReset = Date.now();
    }
    limit.count++;
    if (limit.count > 10) {
      return socket.emit('telemetry_error', { error: 'Rate limit exceeded' });
    }

    try {
      const parsedData = telemetrySchema.parse(data);
      
      let authorized = false;
      const animal = await prisma.animal.findUnique({ 
        where: { id: parsedData.animalId },
        include: { farm: true }
      });

      if (!animal) return;

      if (socket.user.role === 'FARMER' || socket.user.role === 'FIELD_WORKER') {
        if (animal.farm.ownerId === socket.user.userId) authorized = true;
      } else {
        authorized = true;
      }

      if (authorized) {
        io.to(`farm:${animal.farmId}`).emit('telemetry_update', parsedData);
      } else {
        socket.emit('telemetry_error', { error: 'Unauthorized to emit for this animal' });
      }
    } catch (err) {
      socket.emit('telemetry_error', { error: 'Validation failed' });
    }
  });

  socket.on('disconnect', () => {
    socketRateLimits.delete(socket.id);
    console.log(`[PASHU-RAKSHA WS] Client disconnected: ${socket.id}`);
  });
});

// 4. Background Token Expiration Job
setInterval(() => {
  const now = Math.floor(Date.now() / 1000);
  io.sockets.sockets.forEach((socket) => {
    if (socket.tokenExp && socket.tokenExp < now) {
      console.log(`[PASHU-RAKSHA WS] Disconnecting expired token: ${socket.id}`);
      socket.disconnect(true);
    }
  });
}, 60000);

const PORT = process.env.PORT || 3000;
httpServer.listen(PORT, () => {
  console.log(`PASHU-RAKSHA Production Backend running on port ${PORT}`);
});
