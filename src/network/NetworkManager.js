import Peer from 'peerjs';
import { MessageTypes } from './MessageTypes.js';

// Fixed host ID - only one VR host at a time
const FIXED_HOST_ID = 'vr-game-host';
const CONNECTION_TIMEOUT = 10000; // 10 seconds

// Player types
export const PlayerType = {
  DASHBOARD: 'dashboard',
  VR: 'vr',
  PC: 'pc'
};

class NetworkManager {
  constructor() {
    this.peer = null;
    this.connections = new Map();
    this.playerTypes = new Map(); // playerId -> PlayerType
    this.isHost = false;
    this.hostConnection = null;
    this.playerId = null;
    this.playerType = null;
    this.roomCode = null;
    this.vrClientId = null; // Track the VR client connection

    this.eventHandlers = new Map();
  }

  // Create a promise with timeout
  _withTimeout(promise, timeoutMs, errorMessage) {
    return Promise.race([
      promise,
      new Promise((_, reject) =>
        setTimeout(() => reject(new Error(errorMessage)), timeoutMs)
      )
    ]);
  }

  // Safe JSON stringify
  _safeStringify(message) {
    try {
      return JSON.stringify(message);
    } catch (e) {
      console.warn('Failed to stringify message:', e);
      return null;
    }
  }

  // Safe send to a connection
  _safeSend(conn, message) {
    if (!conn?.open) return false;

    const data = this._safeStringify(message);
    if (!data) return false;

    try {
      conn.send(data);
      return true;
    } catch (e) {
      console.warn('Failed to send message:', e);
      return false;
    }
  }

  async createRoom() {
    this.roomCode = FIXED_HOST_ID;
    this.peer = new Peer(FIXED_HOST_ID);
    this.playerType = PlayerType.DASHBOARD;

    return new Promise((resolve, reject) => {
      this.peer.on('open', (id) => {
        this.isHost = true;
        this.playerId = 'host';
        console.log('Dashboard host created with code:', id);

        this.peer.on('connection', (conn) => this.handleNewConnection(conn));
        resolve(id);
      });

      this.peer.on('error', (err) => {
        console.error('PeerJS error:', err);
        reject(err);
      });
    });
  }

  // Alias for backwards compatibility
  async createDashboardRoom() {
    return this.createRoom();
  }

  async joinRoom() {
    this.roomCode = FIXED_HOST_ID;
    this.peer = new Peer();
    this.playerType = PlayerType.PC;

    const connectionPromise = new Promise((resolve, reject) => {
      this.peer.on('open', (id) => {
        this.playerId = id;
        console.log('Connecting to host as PC client...');

        this.hostConnection = this.peer.connect(FIXED_HOST_ID, { reliable: true });

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

    return this._withTimeout(
      connectionPromise,
      CONNECTION_TIMEOUT,
      'Connection timeout - host may not be available'
    );
  }

  async joinAsVRClient() {
    this.roomCode = FIXED_HOST_ID;
    this.peer = new Peer();
    this.playerType = PlayerType.VR;

    const connectionPromise = new Promise((resolve, reject) => {
      this.peer.on('open', (id) => {
        this.playerId = id;
        console.log('Connecting to host as VR client...');

        this.hostConnection = this.peer.connect(FIXED_HOST_ID, { reliable: true });

        this.hostConnection.on('open', () => {
          console.log('Connected to host as VR');
          this.setupClientConnection(this.hostConnection);
          // Notify host that this is the VR client
          this.sendToHost({
            type: MessageTypes.VR_CLIENT_JOIN,
            playerId: this.playerId
          });
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

    return this._withTimeout(
      connectionPromise,
      CONNECTION_TIMEOUT,
      'Connection timeout - host may not be available'
    );
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
    const data = this._safeStringify(message);
    if (!data) return;

    this.connections.forEach(conn => {
      if (conn?.open) {
        try {
          conn.send(data);
        } catch (e) {
          console.warn('Failed to broadcast to connection:', e);
        }
      }
    });
  }

  sendToHost(message) {
    return this._safeSend(this.hostConnection, message);
  }

  sendTo(playerId, message) {
    const conn = this.connections.get(playerId);
    return this._safeSend(conn, message);
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

  setPlayerType(playerId, type) {
    this.playerTypes.set(playerId, type);
    if (type === PlayerType.VR) {
      this.vrClientId = playerId;
    }
  }

  getPlayerType(playerId) {
    return this.playerTypes.get(playerId) || PlayerType.PC;
  }

  getVRClientId() {
    return this.vrClientId;
  }

  isVRClient(playerId) {
    return this.playerTypes.get(playerId) === PlayerType.VR;
  }

  disconnect() {
    if (this.peer) {
      this.peer.destroy();
      this.peer = null;
    }
    this.connections.clear();
    this.playerTypes.clear();
    this.hostConnection = null;
    this.isHost = false;
    this.vrClientId = null;
    this.playerType = null;
  }
}

export const networkManager = new NetworkManager();
