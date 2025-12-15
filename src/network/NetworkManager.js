import Peer from 'peerjs';
import { MessageTypes } from './MessageTypes.js';

const CONNECTION_TIMEOUT = 15000; // 15 seconds

// Generate a random 6-character room code
function generateRoomCode() {
  return Math.random().toString(36).substring(2, 8).toUpperCase();
}

// Player types
export const PlayerType = {
  DASHBOARD: 'dashboard',
  VR: 'vr',
  CAMERA: 'camera'
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
    this.roomCode = generateRoomCode();
    this.peer = new Peer(this.roomCode, PEER_CONFIG);
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

  // Shared connection logic for all client types with retry support
  async _joinAsClient(roomCode, playerType, joinMessageType, retryCount = 0) {
    const MAX_RETRIES = 3;
    const RETRY_DELAY = 1000;

    if (!roomCode) {
      throw new Error('Room code is required');
    }

    // Clean up any existing peer before creating new one
    if (this.peer) {
      this.peer.destroy();
      this.peer = null;
    }

    this.roomCode = roomCode.toUpperCase();
    this.peer = new Peer(PEER_CONFIG);
    this.playerType = playerType;

    const connectionPromise = new Promise((resolve, reject) => {
      this.peer.on('open', (id) => {
        this.playerId = id;
        console.log(`[${playerType}] Peer opened with ID:`, id);
        console.log(`[${playerType}] Attempting to connect to room:`, this.roomCode);

        this.hostConnection = this.peer.connect(this.roomCode, { reliable: true });

        this.hostConnection.on('open', () => {
          console.log(`[${playerType}] Connection opened to host`);
          this.setupClientConnection(this.hostConnection);
          // Notify host of this client type
          this.sendToHost({
            type: joinMessageType,
            playerId: this.playerId
          });
          resolve();
        });

        this.hostConnection.on('error', (err) => {
          console.error(`[${playerType}] Connection error:`, err);
          reject(err);
        });

        this.hostConnection.on('close', () => {
          console.log(`[${playerType}] Connection closed before opening`);
          reject(new Error('Connection closed before opening'));
        });
      });

      this.peer.on('error', (err) => {
        console.error(`[${playerType}] PeerJS error:`, err.type, err);
        if (err.type === 'peer-unavailable') {
          reject(new Error('Host not found - make sure Dashboard Host is running'));
        } else {
          reject(err);
        }
      });
    });

    try {
      return await this._withTimeout(
        connectionPromise,
        CONNECTION_TIMEOUT,
        'Connection timeout - host may not be available'
      );
    } catch (err) {
      // Retry on negotiation failure
      const isNegotiationError = err.message?.includes('Negotiation') ||
                                  err.message?.includes('negotiation') ||
                                  err.type === 'negotiation-failed';

      if (retryCount < MAX_RETRIES && isNegotiationError) {
        console.log(`[${playerType}] Connection failed, retrying (${retryCount + 1}/${MAX_RETRIES})...`);
        await new Promise(r => setTimeout(r, RETRY_DELAY));
        return this._joinAsClient(roomCode, playerType, joinMessageType, retryCount + 1);
      }
      throw err;
    }
  }

  async joinAsVRClient(roomCode) {
    return this._joinAsClient(roomCode, PlayerType.VR, MessageTypes.VR_CLIENT_JOIN);
  }

  async joinAsCamera(roomCode) {
    return this._joinAsClient(roomCode, PlayerType.CAMERA, MessageTypes.CAMERA_JOIN);
  }

  handleNewConnection(conn) {
    console.log('[Host] New connection attempt from:', conn.peer);
    console.log('[Host] Connection state:', conn.open ? 'open' : 'pending');

    conn.on('open', () => {
      console.log('[Host] Connection OPENED with:', conn.peer);
      this.connections.set(conn.peer, conn);

      conn.on('data', (data) => {
        this.handleMessage(conn.peer, data);
      });

      conn.on('close', () => {
        console.log('[Host] Player disconnected:', conn.peer);
        this.connections.delete(conn.peer);
        this.emit(MessageTypes.PLAYER_LEAVE, { playerId: conn.peer });
      });

      this.emit(MessageTypes.PLAYER_JOIN, { playerId: conn.peer });
    });

    conn.on('error', (err) => {
      console.error('[Host] Connection ERROR with peer:', conn.peer, err);
    });

    conn.on('close', () => {
      console.log('[Host] Connection CLOSED with peer (before open):', conn.peer);
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

  sendToVRClient(message) {
    if (!this.vrClientId) return;
    const conn = this.connections.get(this.vrClientId);
    this._safeSend(conn, message);
  }

  sendToCameraClients(message) {
    const data = this._safeStringify(message);
    if (!data) return;

    this.connections.forEach((conn, playerId) => {
      if (this.playerTypes.get(playerId) === PlayerType.CAMERA && conn?.open) {
        try {
          conn.send(data);
        } catch (e) {
          console.warn('Failed to send to camera client:', e);
        }
      }
    });
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
    return this.playerTypes.get(playerId) || PlayerType.VR;
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
