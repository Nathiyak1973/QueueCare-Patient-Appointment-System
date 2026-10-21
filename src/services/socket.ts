import { io, Socket } from 'socket.io-client';

let socket: Socket | null = null;

export const getSocket = (): Socket => {
  if (!socket) {
    socket = io({
      autoConnect: true,
      reconnectionAttempts: 5,
      reconnectionDelay: 2000,
      transports: ['websocket', 'polling'],
    });

    socket.on('connect', () => {
      console.log('[Socket] Connected to real-time CareQueue server:', socket?.id);
    });

    socket.on('connect_error', (err) => {
      console.warn('[Socket] Connection fallback:', err.message);
    });
  }
  return socket;
};
