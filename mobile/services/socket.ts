import { io, Socket } from 'socket.io-client';
import { SOCKET_URL } from '../constants/Api';
import { NearbyBusiness, NearbyTouristPoint } from '../types';

let socket: Socket | null = null;

export function connectSocket(userId: string): Socket {
  if (socket?.connected) return socket;

  socket = io(SOCKET_URL, {
    transports: ['websocket'],
    forceNew: true,
  });

  socket.on('connect', () => {
    socket?.emit('join', userId);
  });

  return socket;
}

export function disconnectSocket(): void {
  if (socket) {
    socket.disconnect();
    socket = null;
  }
}

export function onBusinessNearby(callback: (business: NearbyBusiness) => void): () => void {
  if (!socket) return () => {};
  socket.on('business_nearby', callback);
  return () => {
    socket?.off('business_nearby', callback);
  };
}

export function onTouristPointNearby(callback: (point: NearbyTouristPoint) => void): () => void {
  if (!socket) return () => {};
  socket.on('tourist_point_nearby', callback);
  return () => {
    socket?.off('tourist_point_nearby', callback);
  };
}

export function getSocket(): Socket | null {
  return socket;
}
