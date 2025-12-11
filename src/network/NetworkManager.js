import Peer from 'peerjs';
import { MessageTypes } from './MessageTypes.js';

class NetworkManager {
  constructor() {
    this.peer = null;
    this.connections = new Map();
    this.isHost = false;
    this.hostConnection = null;
    this.playerId = null;
    this.roomCode = null;

    this.eventHandlers = new Map();
  }

  generateRoomCode() {
    const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
    let code = '';
    for (let i = 0; i < 6; i++) {
      code += chars[Math.floor(Math.random() * chars.length)];
    }
    return code;
  }

  async createRoom() {
    this.roomCode = this.generateRoomCode();
    this.peer = new Peer(this.roomCode);

    return new Promise((resolve, reject) => {
      this.peer.on('open', (id) => {
        this.isHost = true;
        this.playerId = 'host';
        console.log('Room created with code:', id);

        this.peer.on('connection', (conn) => this.handleNewConnection(conn));
        resolve(id);
      });

      this.peer.on('error', (err) => {
        console.error('PeerJS error:', err);
        reject(err);
      });
    });
  }

  async joinRoom(roomCode) {
    this.roomCode = roomCode;
    this.peer = new Peer();

    return new Promise((resolve, reject) => {
      this.peer.on('open', (id) => {
        this.playerId = id;
        console.log('Connecting to room:', roomCode);

        this.hostConnection = this.peer.connect(roomCode, { reliable: true });

        this.hostConnection.on('open', () => {
          console.log('Connected to host');
          this.setupClientConnection(this.hostConnection);
          resolve();
        });

        this.hostConnection.on('error', (err) => {
          console.error('Connection error:', err);
          reject(err);
        });
      });

      this.peer.on('error', (err) => {
        console.error('PeerJS error:', err);
        reject(err);
      });
    });
  }

  handleNewConnection(conn) {
    console.log('New player connected:', conn.peer);

    conn.on('open', () => {
      this.connections.set(conn.peer, conn);

      conn.on('data', (data) => {
        this.handleMessage(conn.peer, data);
      });

      conn.on('close', () => {
        console.log('Player disconnected:', conn.peer);
        this.connections.delete(conn.peer);
        this.emit(MessageTypes.PLAYER_LEAVE, { playerId: conn.peer });
      });

      this.emit(MessageTypes.PLAYER_JOIN, { playerId: conn.peer });
    });
  }

  setupClientConnection(conn) {
    conn.on('data', (data) => {
      this.handleMessage('host', data);
    });

    conn.on('close', () => {
      console.log('Disconnected from host');
      this.emit('disconnected', {});
    });
  }

  handleMessage(senderId, data) {
    try {
      const message = typeof data === 'string' ? JSON.parse(data) : data;
      this.emit(message.type, { ...message, senderId });
    } catch (e) {
      console.error('Failed to parse message:', e);
    }
  }

  broadcast(message) {
    const data = JSON.stringify(message);
    this.connections.forEach(conn => {
      if (conn.open) {
        conn.send(data);
      }
    });
  }

  sendToHost(message) {
    if (this.hostConnection && this.hostConnection.open) {
      this.hostConnection.send(JSON.stringify(message));
    }
  }

  sendTo(playerId, message) {
    const conn = this.connections.get(playerId);
    if (conn && conn.open) {
      conn.send(JSON.stringify(message));
    }
  }

  on(eventType, handler) {
    if (!this.eventHandlers.has(eventType)) {
      this.eventHandlers.set(eventType, []);
    }
    this.eventHandlers.get(eventType).push(handler);
  }

  off(eventType, handler) {
    const handlers = this.eventHandlers.get(eventType);
    if (handlers) {
      const index = handlers.indexOf(handler);
      if (index > -1) {
        handlers.splice(index, 1);
      }
    }
  }

  emit(eventType, data) {
    const handlers = this.eventHandlers.get(eventType);
    if (handlers) {
      handlers.forEach(handler => handler(data));
    }
  }

  getConnectedPlayerIds() {
    return Array.from(this.connections.keys());
  }

  getPlayerCount() {
    return this.connections.size + (this.isHost ? 1 : 0);
  }

  disconnect() {
    if (this.peer) {
      this.peer.destroy();
      this.peer = null;
    }
    this.connections.clear();
    this.hostConnection = null;
    this.isHost = false;
  }
}

export const networkManager = new NetworkManager();
