import { Server as SocketIOServer } from 'socket.io';

let ioInstance: SocketIOServer | null = null;

export const setSocketIOInstance = (io: SocketIOServer): void => {
  ioInstance = io;
};

export const getIO = (): SocketIOServer | null => {
  return ioInstance;
};
