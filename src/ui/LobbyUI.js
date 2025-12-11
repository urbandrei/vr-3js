export class LobbyUI {
  constructor() {
    this.container = null;
    this.roomCodeDisplay = null;
    this.joinInput = null;
    this.statusText = null;
    this.playerList = null;

    this.onHostGame = null;
    this.onJoinGame = null;
    this.onEnterVR = null;

    this.createUI();
  }

  createUI() {
    this.container = document.createElement('div');
    this.container.id = 'lobby';
    this.container.innerHTML = `
      <div class="lobby-panel">
        <h1>VR Sandbox</h1>

        <div class="lobby-section">
          <h2>Host Game (VR)</h2>
          <button id="host-btn" class="btn btn-primary">Host Game</button>
          <div id="room-code-display" class="room-code" style="display: none;">
            <span>Room Code:</span>
            <strong id="room-code"></strong>
          </div>
          <button id="enter-vr-btn" class="btn btn-vr" style="display: none;">Enter VR</button>
        </div>

        <div class="lobby-divider">OR</div>

        <div class="lobby-section">
          <h2>Join Game (PC)</h2>
          <input type="text" id="join-input" placeholder="Enter room code" maxlength="6" />
          <button id="join-btn" class="btn btn-secondary">Join</button>
        </div>

        <div id="status" class="status"></div>

        <div id="player-list" class="player-list" style="display: none;">
          <h3>Players</h3>
          <ul id="players"></ul>
        </div>
      </div>
    `;

    const style = document.createElement('style');
    style.textContent = `
      #lobby {
        position: fixed;
        top: 0;
        left: 0;
        width: 100%;
        height: 100%;
        display: flex;
        justify-content: center;
        align-items: center;
        background: linear-gradient(135deg, #1a1a2e 0%, #16213e 100%);
        font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
        color: white;
        z-index: 1000;
      }

      .lobby-panel {
        background: rgba(255, 255, 255, 0.1);
        border-radius: 16px;
        padding: 40px;
        min-width: 320px;
        backdrop-filter: blur(10px);
        box-shadow: 0 8px 32px rgba(0, 0, 0, 0.3);
      }

      .lobby-panel h1 {
        margin: 0 0 30px;
        font-size: 28px;
        text-align: center;
      }

      .lobby-panel h2 {
        margin: 0 0 15px;
        font-size: 16px;
        color: #aaa;
      }

      .lobby-section {
        margin-bottom: 20px;
      }

      .lobby-divider {
        text-align: center;
        color: #666;
        margin: 20px 0;
        font-size: 14px;
      }

      .btn {
        width: 100%;
        padding: 14px 20px;
        border: none;
        border-radius: 8px;
        font-size: 16px;
        cursor: pointer;
        transition: all 0.2s;
        margin-bottom: 10px;
      }

      .btn:hover {
        transform: translateY(-2px);
      }

      .btn:disabled {
        opacity: 0.5;
        cursor: not-allowed;
        transform: none;
      }

      .btn-primary {
        background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
        color: white;
      }

      .btn-secondary {
        background: rgba(255, 255, 255, 0.2);
        color: white;
      }

      .btn-vr {
        background: linear-gradient(135deg, #f093fb 0%, #f5576c 100%);
        color: white;
      }

      #join-input {
        width: 100%;
        padding: 14px;
        border: 2px solid rgba(255, 255, 255, 0.2);
        border-radius: 8px;
        background: rgba(255, 255, 255, 0.1);
        color: white;
        font-size: 18px;
        text-align: center;
        text-transform: uppercase;
        letter-spacing: 4px;
        margin-bottom: 10px;
        box-sizing: border-box;
      }

      #join-input::placeholder {
        color: #666;
        letter-spacing: 1px;
        text-transform: none;
      }

      .room-code {
        background: rgba(0, 0, 0, 0.3);
        padding: 15px;
        border-radius: 8px;
        text-align: center;
        margin-bottom: 10px;
      }

      .room-code strong {
        display: block;
        font-size: 32px;
        letter-spacing: 6px;
        margin-top: 5px;
        color: #4ade80;
      }

      .status {
        text-align: center;
        padding: 10px;
        color: #fbbf24;
        min-height: 20px;
      }

      .player-list {
        margin-top: 20px;
        padding-top: 20px;
        border-top: 1px solid rgba(255, 255, 255, 0.1);
      }

      .player-list h3 {
        margin: 0 0 10px;
        font-size: 14px;
        color: #aaa;
      }

      .player-list ul {
        list-style: none;
        padding: 0;
        margin: 0;
      }

      .player-list li {
        padding: 8px 12px;
        background: rgba(255, 255, 255, 0.1);
        border-radius: 4px;
        margin-bottom: 5px;
        font-size: 14px;
      }

      #game-hud {
        position: fixed;
        top: 20px;
        left: 20px;
        background: rgba(0, 0, 0, 0.7);
        padding: 15px;
        border-radius: 8px;
        color: white;
        font-family: monospace;
        z-index: 100;
      }

      #game-hud .room-info {
        font-size: 12px;
        color: #aaa;
      }

      #game-hud .room-info strong {
        color: #4ade80;
        font-size: 16px;
      }
    `;

    document.head.appendChild(style);
    document.body.appendChild(this.container);

    this.roomCodeDisplay = document.getElementById('room-code-display');
    this.joinInput = document.getElementById('join-input');
    this.statusText = document.getElementById('status');
    this.playerList = document.getElementById('player-list');

    document.getElementById('host-btn').addEventListener('click', () => {
      if (this.onHostGame) this.onHostGame();
    });

    document.getElementById('join-btn').addEventListener('click', () => {
      const code = this.joinInput.value.toUpperCase().trim();
      if (code && this.onJoinGame) this.onJoinGame(code);
    });

    document.getElementById('enter-vr-btn').addEventListener('click', () => {
      if (this.onEnterVR) this.onEnterVR();
    });

    this.joinInput.addEventListener('input', () => {
      this.joinInput.value = this.joinInput.value.toUpperCase();
    });
  }

  showRoomCode(code) {
    document.getElementById('room-code').textContent = code;
    this.roomCodeDisplay.style.display = 'block';
    document.getElementById('enter-vr-btn').style.display = 'block';
    document.getElementById('host-btn').style.display = 'none';
  }

  setStatus(message) {
    this.statusText.textContent = message;
  }

  updatePlayerList(players) {
    const list = document.getElementById('players');
    list.innerHTML = '';

    players.forEach(player => {
      const li = document.createElement('li');
      li.textContent = `${player.type === 'vr' ? '🥽' : '🖥️'} ${player.id.substring(0, 8)}`;
      list.appendChild(li);
    });

    this.playerList.style.display = players.length > 0 ? 'block' : 'none';
  }

  hide() {
    this.container.style.display = 'none';
  }

  show() {
    this.container.style.display = 'flex';
  }

  createGameHUD(roomCode, isHost) {
    const hud = document.createElement('div');
    hud.id = 'game-hud';
    hud.innerHTML = `
      <div class="room-info">
        Room: <strong>${roomCode}</strong>
      </div>
      <div id="hud-players">Players: 1</div>
    `;
    document.body.appendChild(hud);
    return hud;
  }

  updateHUDPlayers(count) {
    const el = document.getElementById('hud-players');
    if (el) {
      el.textContent = `Players: ${count}`;
    }
  }
}
