import { networkManager } from './network/NetworkManager.js';
import { LobbyUI } from './ui/LobbyUI.js';
import { DashboardHost } from './game/DashboardHost.js';
import { VRClientGame } from './game/VRClientGame.js';
import { ClientGame } from './game/ClientGame.js';

/**
 * Main entry point - handles lobby and game mode switching
 */

let lobbyUI;
let dashboardHost;
let vrClientGame;
let clientGame;

function initLobby() {
  lobbyUI = new LobbyUI();

  // Host Dashboard - runs physics, shows monitoring UI
  lobbyUI.onHostDashboard = async () => {
    try {
      lobbyUI.setStatus('Starting dashboard host...');
      startDashboardHost();
    } catch (err) {
      console.error('Failed to start dashboard:', err);
      lobbyUI.setStatus('Failed to start: ' + (err.message || 'Unknown error'));
    }
  };

  // Join as VR client
  lobbyUI.onJoinAsVR = async () => {
    try {
      lobbyUI.setStatus('Connecting to host as VR...');
      await networkManager.joinAsVRClient();
      lobbyUI.setStatus('Connected! Starting VR...');
      startVRClientGame();
    } catch (err) {
      console.error('Failed to join as VR:', err);
      lobbyUI.setStatus('Failed to join: ' + (err.message || 'Unknown error'));
    }
  };

  // Join as PC client
  lobbyUI.onJoinGame = async () => {
    try {
      lobbyUI.setStatus('Connecting to host...');
      await networkManager.joinRoom();
      lobbyUI.setStatus('Connected! Starting game...');
      startClientGame();
    } catch (err) {
      console.error('Failed to join:', err);
      lobbyUI.setStatus('Failed to join: ' + (err.message || 'Unknown error'));
    }
  };
}

async function startDashboardHost() {
  try {
    dashboardHost = new DashboardHost(lobbyUI);
    await dashboardHost.start();
  } catch (err) {
    console.error('Failed to start dashboard host:', err);
    lobbyUI.show();
    lobbyUI.setStatus('Failed to start: ' + (err.message || 'Unknown error'));
  }
}

async function startVRClientGame() {
  try {
    vrClientGame = new VRClientGame(lobbyUI);
    await vrClientGame.start();
  } catch (err) {
    console.error('Failed to start VR client:', err);
    lobbyUI.show();
    lobbyUI.setStatus('Failed to start VR: ' + (err.message || 'Unknown error'));
  }
}

function startClientGame() {
  try {
    clientGame = new ClientGame(lobbyUI);
    clientGame.start();
  } catch (err) {
    console.error('Failed to start client game:', err);
    lobbyUI.show();
    lobbyUI.setStatus('Failed to start: ' + (err.message || 'Unknown error'));
  }
}

// Start the app
initLobby();
