import { useEffect, useState } from 'react';
import { io, Socket } from 'socket.io-client';

let socketInstance: Socket | null = null;

export function useSocket() {
  const [isConnected, setIsConnected] = useState(false);

  useEffect(() => {
    // In a real app, backend ws URL comes from env or config
    // For now we mock connection or fallback gracefully
    if (!socketInstance) {
      socketInstance = io('http://localhost:3001', {
        autoConnect: false, // Don't auto-connect yet as backend might not be running
      });
    }

    const onConnect = () => setIsConnected(true);
    const onDisconnect = () => setIsConnected(false);

    socketInstance.on('connect', onConnect);
    socketInstance.on('disconnect', onDisconnect);

    setIsConnected(socketInstance.connected);

    return () => {
      if (socketInstance) {
        socketInstance.off('connect', onConnect);
        socketInstance.off('disconnect', onDisconnect);
      }
    };
  }, []);

  const emit = (event: string, data: unknown) => {
    if (socketInstance) {
      socketInstance.emit(event, data);
    }
  };

  const listen = (event: string, callback: (data: unknown) => void) => {
    if (socketInstance) {
      socketInstance.on(event, callback);
    }
    return () => {
      if (socketInstance) {
        socketInstance.off(event, callback);
      }
    };
  };

  return {
    isConnected,
    socket: socketInstance,
    emit,
    listen,
  };
}
