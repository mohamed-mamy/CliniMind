const { Server } = require('socket.io');
const jwt = require('jsonwebtoken');

let io;

const initSocket = (server) => {
  io = new Server(server, {
    cors: {
      origin: '*', // Adjust for production based on infra-plan
      methods: ['GET', 'POST']
    }
  });

  // Socket authentication middleware
  io.use((socket, next) => {
    try {
      const token = socket.handshake.auth.token || socket.handshake.headers.authorization?.split(' ')[1];
      if (!token) {
        return next(new Error('Authentication error'));
      }
      
      const decoded = jwt.verify(token, process.env.JWT_SECRET || 'secret');
      socket.user = decoded; // { id, role, ... } depending on JWT payload structure
      next();
    } catch (err) {
      next(new Error('Authentication error'));
    }
  });

  io.on('connection', (socket) => {
    console.log(`[Socket] User connected: ${socket.user.id || socket.user._id} (${socket.user.role})`);

    const userId = socket.user.id || socket.user._id;

    // Join personal user room
    socket.join(`user:${userId}`);

    // Join role-specific rooms
    if (socket.user.role === 'doctor') {
      socket.join(`doctor:${userId}`);
    } else if (socket.user.role === 'lab_technician') {
      socket.join('lab');
    }

    socket.on('disconnect', () => {
      console.log(`[Socket] User disconnected: ${userId}`);
    });
  });

  return io;
};

const getIO = () => {
  if (!io) {
    console.warn('Socket.IO not initialized yet');
  }
  return io;
};

/**
 * Helper functions to emit specific events
 */
const emitNotification = (userId, notificationData) => {
  if (io) io.to(`user:${userId}`).emit('notification:new', notificationData);
};

const emitCriticalResult = (doctorId, resultData) => {
  if (io) io.to(`doctor:${doctorId}`).emit('lab:critical_result', resultData);
};

const emitNewLabRequest = (requestData) => {
  if (io) io.to('lab').emit('lab:new_request', requestData);
};

const emitAppointmentReminder = (userId, appointmentData) => {
  if (io) io.to(`user:${userId}`).emit('appointment:reminder', appointmentData);
};

module.exports = {
  initSocket,
  getIO,
  emitNotification,
  emitCriticalResult,
  emitNewLabRequest,
  emitAppointmentReminder
};
