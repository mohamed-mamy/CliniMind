import { io, Socket } from 'socket.io-client';
import { authStore } from '../store/authStore';

const SOCKET_URL = import.meta.env.VITE_SOCKET_URL || import.meta.env.VITE_API_URL || 'http://localhost:3001';

let socket: Socket | null = null;

export const socketService = {
  createConnection: (): Socket => {
    if (socket?.connected) return socket;

    const token = authStore.getAccessToken();

    socket = io(SOCKET_URL, {
      autoConnect: true,
      auth: { token },
    });

    socket.on('connect', () => {
      console.log('[Socket] Connected');
    });

    socket.on('disconnect', (reason) => {
      console.log('[Socket] Disconnected:', reason);
    });

    socket.on('connect_error', (err) => {
      console.warn('[Socket] Connection error:', err.message);
    });

    return socket;
  },

  getSocket: (): Socket | null => socket,

  disconnect: () => {
    if (socket) {
      socket.disconnect();
      socket = null;
    }
  },
};