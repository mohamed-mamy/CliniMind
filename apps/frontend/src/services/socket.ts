import { io, Socket } from 'socket.io-client';

const SOCKET_URL = 'http://localhost:3001';

export const socketService = {
  createConnection: (): Socket => {
    return io(SOCKET_URL, {
      autoConnect: false,
    });
  },
};
