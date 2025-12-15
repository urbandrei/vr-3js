import{n as R,M as I,P as le,S as Me,B as Le,a as G,I as Se,D as Fe,V as v,b as q,T as Be,c as se,d as Ce,L as Ge,e as X,F as Ne,f as S,g as He,C as U,h as N,i as W,j as je,k as Ve,l as Ke,Q as J,m as ze,O as ce,o as Xe,p as qe,q as Q,r as We,s as De,N as Je,t as $e,u as Ye,v as ie,w as Pe,R as re,x as Qe,y as Ze,z as et,A as Z,E as tt,G as nt,H as B,J as st,K as it,U as rt,W as z,X as at,Y as ot,Z as ct,_ as lt,$,a0 as dt,a1 as ht,a2 as ut,a3 as pt,a4 as ft,a5 as mt,a6 as gt,a7 as ke,a8 as xt,a9 as de,aa as he,ab as ue,ac as pe,ad as fe,ae as bt,af as yt,ag as At,ah as Tt,ai as Rt,aj as Et,ak as wt,al as It,am as _t,an as vt,ao as Mt}from"./HandSegmentRenderer-uNxfcPXv.js";class Lt{constructor(){this.container=null,this.roomCodeDisplay=null,this.statusText=null,this.playerList=null,this.onHostDashboard=null,this.onJoinAsVR=null,this.createUI()}createUI(){this.container=document.createElement("div"),this.container.id="lobby",this.container.innerHTML=`
      <div class="lobby-panel">
        <h1>VR Sandbox</h1>

        <div class="lobby-section">
          <h2>Host (Dashboard)</h2>
          <button id="host-dashboard-btn" class="btn btn-host">Host Dashboard</button>
        </div>

        <div class="lobby-divider">PLAYERS</div>

        <div class="lobby-section">
          <h2>Join as VR Player</h2>
          <input type="text" id="room-code-input" class="room-code-input" placeholder="Enter room code" maxlength="6" />
          <button id="join-vr-btn" class="btn btn-vr">Join as VR</button>
        </div>

        <div id="status" class="status"></div>

        <div id="player-list" class="player-list" style="display: none;">
          <h3>Players</h3>
          <ul id="players"></ul>
        </div>
      </div>
    `;const e=document.createElement("style");e.textContent=`
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

      .btn-host {
        background: linear-gradient(135deg, #11998e 0%, #38ef7d 100%);
        color: white;
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

      .room-code-input {
        width: 100%;
        padding: 12px;
        border: 2px solid rgba(255, 255, 255, 0.2);
        border-radius: 8px;
        background: rgba(0, 0, 0, 0.3);
        color: white;
        font-size: 18px;
        text-align: center;
        text-transform: uppercase;
        letter-spacing: 4px;
        margin-bottom: 10px;
        box-sizing: border-box;
      }

      .room-code-input::placeholder {
        color: #666;
        text-transform: none;
        letter-spacing: normal;
      }

      .room-code-input:focus {
        outline: none;
        border-color: #f093fb;
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
    `,document.head.appendChild(e),document.body.appendChild(this.container),this.roomCodeDisplay=document.getElementById("room-code-display"),this.statusText=document.getElementById("status"),this.playerList=document.getElementById("player-list"),document.getElementById("host-dashboard-btn").addEventListener("click",()=>{this.onHostDashboard&&this.onHostDashboard()}),document.getElementById("join-vr-btn").addEventListener("click",()=>{this.onJoinAsVR&&this.onJoinAsVR()})}showRoomCode(e){const t=this.container.querySelector(".lobby-section");if(t){const s=document.createElement("div");s.className="room-code",s.innerHTML=`Room Code:<strong>${e}</strong>`,t.appendChild(s)}console.log("Room code:",e)}getRoomCodeInput(){const e=document.getElementById("room-code-input");return e?e.value.trim().toUpperCase():""}setStatus(e){this.statusText.textContent=e}updatePlayerList(e){const t=document.getElementById("players");t.innerHTML="",e.forEach(s=>{const n=document.createElement("li");n.textContent=`${s.type==="vr"?"🥽":"🖥️"} ${s.id.substring(0,8)}`,t.appendChild(n)}),this.playerList.style.display=e.length>0?"block":"none"}hide(){this.container.style.display="none"}show(){this.container.style.display="flex"}createGameHUD(e,t){const s=document.createElement("div");return s.id="game-hud",s.innerHTML=`
      <div class="room-info">
        Room: <strong>${e}</strong>
      </div>
      <div id="hud-players">Players: 1</div>
    `,document.body.appendChild(s),s}updateHUDPlayers(e){const t=document.getElementById("hud-players");t&&(t.textContent=`Players: ${e}`)}}class St{constructor(){this.players=new Map,this.vrHandData=null,this.vrHeadData=null,this.cameraObjectData={position:{x:0,y:1,z:-.5},rotation:{x:0,y:0,z:0,w:1}},this.stateUpdateInterval=null}initialize(){R.on(I.PLAYER_JOIN,e=>this.onPlayerJoin(e)),R.on(I.PLAYER_LEAVE,e=>this.onPlayerLeave(e)),this.stateUpdateInterval=setInterval(()=>this.broadcastWorldState(),1e3/20)}onPlayerJoin(e){console.log("Player joined:",e.playerId),this.players.set(e.playerId,{id:e.playerId,type:"vr"})}onPlayerLeave(e){console.log("Player left:",e.playerId),this.players.delete(e.playerId)}updateVRHands(e){this.vrHandData=e}updateVRHead(e){this.vrHeadData=e}updateCameraObject(e){this.cameraObjectData=e}getHostStats(){return{playerCount:this.players.size,hasVRHandData:this.vrHandData!==null,hasVRHeadData:this.vrHeadData!==null}}broadcastWorldState(){R.sendToCameraClients({type:I.WORLD_STATE,timestamp:Date.now(),vrHead:this.vrHeadData,vrHands:this.vrHandData,cameraObject:this.cameraObjectData})}cleanup(){this.stateUpdateInterval&&clearInterval(this.stateUpdateInterval),this.players.clear()}}const k=new St;class Ct{constructor(){this.container=null,this.playersPanel=null,this.networkPanel=null,this.eventLog=null,this.errorLog=null,this.maxLogEntries=50,this.createUI()}createUI(){this.container=document.createElement("div"),this.container.id="dashboard",this.container.innerHTML=`
      <div class="dashboard-header">
        <h1>VR Game Host Dashboard</h1>
        <div class="header-status">
          <span id="dash-room-code" class="room-code-display"></span>
          <span id="dash-status" class="status-indicator status-waiting">Waiting for VR client...</span>
          <span id="dash-uptime">Uptime: 0:00</span>
        </div>
      </div>

      <div class="dashboard-grid">
        <div class="panel panel-players">
          <h2>VR Client <span id="player-count">(0)</span></h2>
          <div id="players-list" class="panel-content"></div>
        </div>

        <div class="panel panel-network">
          <h2>Network</h2>
          <div class="panel-content">
            <div class="stat-row">
              <span class="stat-label">VR Client:</span>
              <span id="stat-vr-client" class="stat-value">Not connected</span>
            </div>
            <div class="stat-row">
              <span class="stat-label">VR Latency:</span>
              <span id="stat-vr-latency" class="stat-value">--</span>
            </div>
            <div class="stat-row">
              <span class="stat-label">Messages/s:</span>
              <span id="stat-msg-rate" class="stat-value">0</span>
            </div>
            <div class="stat-row">
              <span class="stat-label">Bandwidth:</span>
              <span id="stat-bandwidth" class="stat-value">0 KB/s</span>
            </div>
          </div>
        </div>

        <div class="panel panel-events">
          <h2>Event Log</h2>
          <div id="event-log" class="panel-content log-content"></div>
        </div>

        <div class="panel panel-errors">
          <h2>Errors</h2>
          <div id="error-log" class="panel-content log-content"></div>
        </div>
      </div>
    `;const e=document.createElement("style");e.textContent=`
      #dashboard {
        position: fixed;
        top: 0;
        left: 0;
        width: 100%;
        height: 100%;
        background: #0f0f1a;
        font-family: 'SF Mono', 'Consolas', monospace;
        color: #e0e0e0;
        overflow: auto;
        padding: 20px;
        box-sizing: border-box;
      }

      .dashboard-header {
        display: flex;
        justify-content: space-between;
        align-items: center;
        margin-bottom: 20px;
        padding-bottom: 15px;
        border-bottom: 1px solid #2a2a3a;
      }

      .dashboard-header h1 {
        margin: 0;
        font-size: 20px;
        font-weight: 600;
        color: #fff;
      }

      .header-status {
        display: flex;
        gap: 20px;
        align-items: center;
        font-size: 13px;
      }

      .status-indicator {
        padding: 4px 12px;
        border-radius: 12px;
        font-weight: 500;
      }

      .status-waiting {
        background: #3d3d00;
        color: #ffd700;
      }

      .status-active {
        background: #003d00;
        color: #4ade80;
      }

      #dash-uptime {
        color: #888;
      }

      .room-code-display {
        background: #1a4a1a;
        color: #4ade80;
        padding: 6px 14px;
        border-radius: 6px;
        font-size: 16px;
        font-weight: 600;
        letter-spacing: 3px;
      }

      .dashboard-grid {
        display: grid;
        grid-template-columns: repeat(2, 1fr);
        gap: 15px;
        max-width: 1000px;
      }

      .panel {
        background: #1a1a2e;
        border-radius: 8px;
        border: 1px solid #2a2a3a;
        overflow: hidden;
      }

      .panel h2 {
        margin: 0;
        padding: 12px 15px;
        font-size: 13px;
        font-weight: 600;
        background: #252538;
        border-bottom: 1px solid #2a2a3a;
        color: #aaa;
        text-transform: uppercase;
        letter-spacing: 0.5px;
      }

      .panel h2 span {
        font-weight: normal;
        color: #666;
      }

      .panel-content {
        padding: 12px 15px;
        max-height: 200px;
        overflow-y: auto;
      }

      .stat-row {
        display: flex;
        justify-content: space-between;
        padding: 6px 0;
        border-bottom: 1px solid #252538;
      }

      .stat-row:last-child {
        border-bottom: none;
      }

      .stat-label {
        color: #888;
      }

      .stat-value {
        font-weight: 500;
        color: #4ade80;
      }

      .player-item {
        display: flex;
        justify-content: space-between;
        align-items: center;
        padding: 8px 10px;
        margin-bottom: 6px;
        background: #252538;
        border-radius: 4px;
        font-size: 12px;
      }

      .player-item .player-id {
        font-weight: 500;
      }

      .player-item .player-type {
        padding: 2px 8px;
        border-radius: 10px;
        font-size: 10px;
        font-weight: 600;
        text-transform: uppercase;
        background: #5b21b6;
        color: #c4b5fd;
      }

      .log-content {
        font-size: 11px;
        max-height: 180px;
      }

      .log-entry {
        padding: 4px 0;
        border-bottom: 1px solid #252538;
        display: flex;
        gap: 10px;
      }

      .log-entry:last-child {
        border-bottom: none;
      }

      .log-time {
        color: #666;
        flex-shrink: 0;
      }

      .log-msg {
        color: #e0e0e0;
      }

      .log-entry.error .log-msg {
        color: #f87171;
      }

      .log-entry.warn .log-msg {
        color: #fbbf24;
      }

      .empty-state {
        color: #555;
        text-align: center;
        padding: 20px;
        font-size: 12px;
      }
    `,document.head.appendChild(e),document.body.appendChild(this.container),this.playersPanel=document.getElementById("players-list"),this.eventLog=document.getElementById("event-log"),this.errorLog=document.getElementById("error-log"),this.playersPanel.innerHTML='<div class="empty-state">No VR client connected</div>',this.eventLog.innerHTML='<div class="empty-state">No events yet</div>',this.errorLog.innerHTML='<div class="empty-state">No errors</div>'}updatePlayers(e,t){if(document.getElementById("player-count").textContent=`(${e.size})`,e.size===0){this.playersPanel.innerHTML='<div class="empty-state">No VR client connected</div>',document.getElementById("dash-status").textContent="Waiting for VR client...",document.getElementById("dash-status").className="status-indicator status-waiting";return}document.getElementById("dash-status").textContent="VR Connected",document.getElementById("dash-status").className="status-indicator status-active";let s="";e.forEach((n,i)=>{s+=`
        <div class="player-item">
          <span class="player-id">${i.substring(0,12)}</span>
          <span class="player-type">VR</span>
        </div>
      `}),this.playersPanel.innerHTML=s}updateNetworkStats(e){const t=e.vrClientId;document.getElementById("stat-vr-client").textContent=t?t.substring(0,12):"Not connected",document.getElementById("stat-vr-latency").textContent=e.vrLatency?`${e.vrLatency}ms`:"--",document.getElementById("stat-msg-rate").textContent=e.messageRate||0,document.getElementById("stat-bandwidth").textContent=`${(e.bandwidth||0).toFixed(1)} KB/s`}updateUptime(e){const t=Math.floor(e/60),s=e%60;document.getElementById("dash-uptime").textContent=`Uptime: ${t}:${s.toString().padStart(2,"0")}`}logEvent(e){this._addLogEntry(this.eventLog,e,"info")}logError(e){this._addLogEntry(this.errorLog,e,"error")}logWarning(e){this._addLogEntry(this.eventLog,e,"warn")}_addLogEntry(e,t,s){const n=e.querySelector(".empty-state");n&&n.remove();const i=new Date().toLocaleTimeString("en-US",{hour12:!1,hour:"2-digit",minute:"2-digit",second:"2-digit"}),r=document.createElement("div");for(r.className=`log-entry ${s}`,r.innerHTML=`
      <span class="log-time">${i}</span>
      <span class="log-msg">${t}</span>
    `,e.insertBefore(r,e.firstChild);e.children.length>this.maxLogEntries;)e.removeChild(e.lastChild)}setRoomCode(e){const t=document.getElementById("dash-room-code");t&&(t.textContent=`Room: ${e}`)}hide(){this.container.style.display="none"}show(){this.container.style.display="block"}}class Nt{constructor(e){this.lobbyUI=e,this.dashboardUI=null,this.uptimeInterval=null,this.startTime=Date.now(),this.lastStatsTime=Date.now(),this.messageCount=0,this.bytesReceived=0,this.vrClientId=null,this.lastVRHandTime=0,this.vrLatency=0}async start(){this.lobbyUI.hide(),this.dashboardUI=new Ct,this.dashboardUI.logEvent("Dashboard host starting...");try{const e=await R.createRoom();this.dashboardUI.setRoomCode(e),this.dashboardUI.logEvent(`Room created with code: ${e}`),k.initialize(),this.dashboardUI.logEvent("Host manager initialized"),this._setupNetworkHandlers(),this.uptimeInterval=setInterval(()=>{const t=Math.floor((Date.now()-this.startTime)/1e3);this.dashboardUI.updateUptime(t)},1e3),setInterval(()=>this._updateStats(),1e3),this.dashboardUI.logEvent("Dashboard host ready")}catch(e){console.error("Failed to start dashboard host:",e),this.dashboardUI.logError(`Failed to start: ${e.message}`),this.lobbyUI.show(),this.lobbyUI.setStatus("Failed to start host: "+e.message)}}_setupNetworkHandlers(){R.on(I.VR_CLIENT_JOIN,e=>{if(this.vrClientId){this.dashboardUI.logWarning(`Rejected VR client ${e.playerId} - already have VR client`);return}this.vrClientId=e.senderId,R.setPlayerType(e.senderId,le.VR),this.dashboardUI.logEvent(`VR client connected: ${e.senderId.substring(0,12)}`);const t=k.players.get(e.senderId);t&&(t.type="vr")}),R.on(I.VR_HAND_TRACKING,e=>{e.senderId===this.vrClientId&&(e.timestamp&&(this.vrLatency=Date.now()-e.timestamp),this.lastVRHandTime=Date.now(),k.updateVRHands(e.hands),this.messageCount++,this.bytesReceived+=150)}),R.on(I.VR_HEAD_TRACKING,e=>{e.senderId===this.vrClientId&&(k.updateVRHead(e.head),this.messageCount++,this.bytesReceived+=100)}),R.on(I.PLAYER_JOIN,e=>{const t=R.getPlayerType(e.playerId);this.dashboardUI.logEvent(`Player joined: ${e.playerId.substring(0,12)} (${t})`)}),R.on(I.PLAYER_LEAVE,e=>{this.dashboardUI.logEvent(`Player left: ${e.playerId.substring(0,12)}`),e.playerId===this.vrClientId&&(this.vrClientId=null,this.dashboardUI.logWarning("VR client disconnected"))}),R.on(I.CAMERA_JOIN,e=>{R.setPlayerType(e.senderId,le.CAMERA),this.dashboardUI.logEvent(`Camera view connected: ${e.senderId.substring(0,12)}`)}),R.on(I.CAMERA_UPDATE,e=>{e.senderId===this.vrClientId&&k.updateCameraObject(e.camera)})}_updateStats(){const e=Date.now(),t=(e-this.lastStatsTime)/1e3,s=Math.round(this.messageCount/t),n=this.bytesReceived/1024/t;this.dashboardUI.updateNetworkStats({vrClientId:this.vrClientId,vrLatency:this.vrLatency,messageRate:s,bandwidth:n}),this.dashboardUI.updatePlayers(k.players,this.vrClientId),this.messageCount=0,this.bytesReceived=0,this.lastStatsTime=e}stop(){this.uptimeInterval&&(clearInterval(this.uptimeInterval),this.uptimeInterval=null),k.cleanup(),R.disconnect(),this.dashboardUI&&this.dashboardUI.hide()}}const me=new q,ge=new v;class xe{constructor(e,t,s,n,i){this.controller=t,this.handModel=e,this.envMap=null;let r;!i||!i.primitive||i.primitive==="sphere"?r=new Me(1,10,10):i.primitive==="box"&&(r=new Le(1,1,1));const o=new G;this.handMesh=new Se(r,o,30),this.handMesh.frustumCulled=!1,this.handMesh.instanceMatrix.setUsage(Fe),this.handMesh.castShadow=!0,this.handMesh.receiveShadow=!0,this.handModel.add(this.handMesh),this.joints=["wrist","thumb-metacarpal","thumb-phalanx-proximal","thumb-phalanx-distal","thumb-tip","index-finger-metacarpal","index-finger-phalanx-proximal","index-finger-phalanx-intermediate","index-finger-phalanx-distal","index-finger-tip","middle-finger-metacarpal","middle-finger-phalanx-proximal","middle-finger-phalanx-intermediate","middle-finger-phalanx-distal","middle-finger-tip","ring-finger-metacarpal","ring-finger-phalanx-proximal","ring-finger-phalanx-intermediate","ring-finger-phalanx-distal","ring-finger-tip","pinky-finger-metacarpal","pinky-finger-phalanx-proximal","pinky-finger-phalanx-intermediate","pinky-finger-phalanx-distal","pinky-finger-tip"]}updateMesh(){const t=this.controller.joints;let s=0;for(let n=0;n<this.joints.length;n++){const i=t[this.joints[n]];i.visible&&(ge.setScalar(i.jointRadius||.008),me.compose(i.position,i.quaternion,ge),this.handMesh.setMatrixAt(n,me),s++)}this.handMesh.count=s,this.handMesh.instanceMatrix.needsUpdate=!0}}function be(d,e){if(e===Be)return console.warn("THREE.BufferGeometryUtils.toTrianglesDrawMode(): Geometry already defined as triangles."),d;if(e===se||e===Ce){let t=d.getIndex();if(t===null){const r=[],o=d.getAttribute("position");if(o!==void 0){for(let a=0;a<o.count;a++)r.push(a);d.setIndex(r),t=d.getIndex()}else return console.error("THREE.BufferGeometryUtils.toTrianglesDrawMode(): Undefined position attribute. Processing not possible."),d}const s=t.count-2,n=[];if(e===se)for(let r=1;r<=s;r++)n.push(t.getX(0)),n.push(t.getX(r)),n.push(t.getX(r+1));else for(let r=0;r<s;r++)r%2===0?(n.push(t.getX(r)),n.push(t.getX(r+1)),n.push(t.getX(r+2))):(n.push(t.getX(r+2)),n.push(t.getX(r+1)),n.push(t.getX(r)));n.length/3!==s&&console.error("THREE.BufferGeometryUtils.toTrianglesDrawMode(): Unable to generate correct amount of triangles.");const i=d.clone();return i.setIndex(n),i.clearGroups(),i}else return console.error("THREE.BufferGeometryUtils.toTrianglesDrawMode(): Unknown draw mode:",e),d}class Ht extends Ge{constructor(e){super(e),this.dracoLoader=null,this.ktx2Loader=null,this.meshoptDecoder=null,this.pluginCallbacks=[],this.register(function(t){return new Ut(t)}),this.register(function(t){return new Ft(t)}),this.register(function(t){return new Wt(t)}),this.register(function(t){return new Jt(t)}),this.register(function(t){return new $t(t)}),this.register(function(t){return new Gt(t)}),this.register(function(t){return new jt(t)}),this.register(function(t){return new Vt(t)}),this.register(function(t){return new Kt(t)}),this.register(function(t){return new Ot(t)}),this.register(function(t){return new zt(t)}),this.register(function(t){return new Bt(t)}),this.register(function(t){return new qt(t)}),this.register(function(t){return new Xt(t)}),this.register(function(t){return new Pt(t)}),this.register(function(t){return new Yt(t)}),this.register(function(t){return new Qt(t)})}load(e,t,s,n){const i=this;let r;if(this.resourcePath!=="")r=this.resourcePath;else if(this.path!==""){const c=X.extractUrlBase(e);r=X.resolveURL(c,this.path)}else r=X.extractUrlBase(e);this.manager.itemStart(e);const o=function(c){n?n(c):console.error(c),i.manager.itemError(e),i.manager.itemEnd(e)},a=new Ne(this.manager);a.setPath(this.path),a.setResponseType("arraybuffer"),a.setRequestHeader(this.requestHeader),a.setWithCredentials(this.withCredentials),a.load(e,function(c){try{i.parse(c,r,function(h){t(h),i.manager.itemEnd(e)},o)}catch(h){o(h)}},s,o)}setDRACOLoader(e){return this.dracoLoader=e,this}setKTX2Loader(e){return this.ktx2Loader=e,this}setMeshoptDecoder(e){return this.meshoptDecoder=e,this}register(e){return this.pluginCallbacks.indexOf(e)===-1&&this.pluginCallbacks.push(e),this}unregister(e){return this.pluginCallbacks.indexOf(e)!==-1&&this.pluginCallbacks.splice(this.pluginCallbacks.indexOf(e),1),this}parse(e,t,s,n){let i;const r={},o={},a=new TextDecoder;if(typeof e=="string")i=JSON.parse(e);else if(e instanceof ArrayBuffer)if(a.decode(new Uint8Array(e,0,4))===Oe){try{r[g.KHR_BINARY_GLTF]=new Zt(e)}catch(l){n&&n(l);return}i=JSON.parse(r[g.KHR_BINARY_GLTF].content)}else i=JSON.parse(a.decode(e));else i=e;if(i.asset===void 0||i.asset.version[0]<2){n&&n(new Error("THREE.GLTFLoader: Unsupported asset. glTF versions >=2.0 are supported."));return}const c=new pn(i,{path:t||this.resourcePath||"",crossOrigin:this.crossOrigin,requestHeader:this.requestHeader,manager:this.manager,ktx2Loader:this.ktx2Loader,meshoptDecoder:this.meshoptDecoder});c.fileLoader.setRequestHeader(this.requestHeader);for(let h=0;h<this.pluginCallbacks.length;h++){const l=this.pluginCallbacks[h](c);l.name||console.error("THREE.GLTFLoader: Invalid plugin found: missing name"),o[l.name]=l,r[l.name]=!0}if(i.extensionsUsed)for(let h=0;h<i.extensionsUsed.length;++h){const l=i.extensionsUsed[h],u=i.extensionsRequired||[];switch(l){case g.KHR_MATERIALS_UNLIT:r[l]=new kt;break;case g.KHR_DRACO_MESH_COMPRESSION:r[l]=new en(i,this.dracoLoader);break;case g.KHR_TEXTURE_TRANSFORM:r[l]=new tn;break;case g.KHR_MESH_QUANTIZATION:r[l]=new nn;break;default:u.indexOf(l)>=0&&o[l]===void 0&&console.warn('THREE.GLTFLoader: Unknown extension "'+l+'".')}}c.setExtensions(r),c.setPlugins(o),c.parse(s,n)}parseAsync(e,t){const s=this;return new Promise(function(n,i){s.parse(e,t,n,i)})}}function Dt(){let d={};return{get:function(e){return d[e]},add:function(e,t){d[e]=t},remove:function(e){delete d[e]},removeAll:function(){d={}}}}const g={KHR_BINARY_GLTF:"KHR_binary_glTF",KHR_DRACO_MESH_COMPRESSION:"KHR_draco_mesh_compression",KHR_LIGHTS_PUNCTUAL:"KHR_lights_punctual",KHR_MATERIALS_CLEARCOAT:"KHR_materials_clearcoat",KHR_MATERIALS_DISPERSION:"KHR_materials_dispersion",KHR_MATERIALS_IOR:"KHR_materials_ior",KHR_MATERIALS_SHEEN:"KHR_materials_sheen",KHR_MATERIALS_SPECULAR:"KHR_materials_specular",KHR_MATERIALS_TRANSMISSION:"KHR_materials_transmission",KHR_MATERIALS_IRIDESCENCE:"KHR_materials_iridescence",KHR_MATERIALS_ANISOTROPY:"KHR_materials_anisotropy",KHR_MATERIALS_UNLIT:"KHR_materials_unlit",KHR_MATERIALS_VOLUME:"KHR_materials_volume",KHR_TEXTURE_BASISU:"KHR_texture_basisu",KHR_TEXTURE_TRANSFORM:"KHR_texture_transform",KHR_MESH_QUANTIZATION:"KHR_mesh_quantization",KHR_MATERIALS_EMISSIVE_STRENGTH:"KHR_materials_emissive_strength",EXT_MATERIALS_BUMP:"EXT_materials_bump",EXT_TEXTURE_WEBP:"EXT_texture_webp",EXT_TEXTURE_AVIF:"EXT_texture_avif",EXT_MESHOPT_COMPRESSION:"EXT_meshopt_compression",EXT_MESH_GPU_INSTANCING:"EXT_mesh_gpu_instancing"};class Pt{constructor(e){this.parser=e,this.name=g.KHR_LIGHTS_PUNCTUAL,this.cache={refs:{},uses:{}}}_markDefs(){const e=this.parser,t=this.parser.json.nodes||[];for(let s=0,n=t.length;s<n;s++){const i=t[s];i.extensions&&i.extensions[this.name]&&i.extensions[this.name].light!==void 0&&e._addNodeRef(this.cache,i.extensions[this.name].light)}}_loadLight(e){const t=this.parser,s="light:"+e;let n=t.cache.get(s);if(n)return n;const i=t.json,a=((i.extensions&&i.extensions[this.name]||{}).lights||[])[e];let c;const h=new U(16777215);a.color!==void 0&&h.setRGB(a.color[0],a.color[1],a.color[2],N);const l=a.range!==void 0?a.range:0;switch(a.type){case"directional":c=new Ke(h),c.target.position.set(0,0,-1),c.add(c.target);break;case"point":c=new Ve(h),c.distance=l;break;case"spot":c=new je(h),c.distance=l,a.spot=a.spot||{},a.spot.innerConeAngle=a.spot.innerConeAngle!==void 0?a.spot.innerConeAngle:0,a.spot.outerConeAngle=a.spot.outerConeAngle!==void 0?a.spot.outerConeAngle:Math.PI/4,c.angle=a.spot.outerConeAngle,c.penumbra=1-a.spot.innerConeAngle/a.spot.outerConeAngle,c.target.position.set(0,0,-1),c.add(c.target);break;default:throw new Error("THREE.GLTFLoader: Unexpected light type: "+a.type)}return c.position.set(0,0,0),c.decay=2,C(c,a),a.intensity!==void 0&&(c.intensity=a.intensity),c.name=t.createUniqueName(a.name||"light_"+e),n=Promise.resolve(c),t.cache.add(s,n),n}getDependency(e,t){if(e==="light")return this._loadLight(t)}createNodeAttachment(e){const t=this,s=this.parser,i=s.json.nodes[e],o=(i.extensions&&i.extensions[this.name]||{}).light;return o===void 0?null:this._loadLight(o).then(function(a){return s._getNodeRef(t.cache,o,a)})}}class kt{constructor(){this.name=g.KHR_MATERIALS_UNLIT}getMaterialType(){return B}extendParams(e,t,s){const n=[];e.color=new U(1,1,1),e.opacity=1;const i=t.pbrMetallicRoughness;if(i){if(Array.isArray(i.baseColorFactor)){const r=i.baseColorFactor;e.color.setRGB(r[0],r[1],r[2],N),e.opacity=r[3]}i.baseColorTexture!==void 0&&n.push(s.assignTexture(e,"map",i.baseColorTexture,W))}return Promise.all(n)}}class Ot{constructor(e){this.parser=e,this.name=g.KHR_MATERIALS_EMISSIVE_STRENGTH}extendMaterialParams(e,t){const n=this.parser.json.materials[e];if(!n.extensions||!n.extensions[this.name])return Promise.resolve();const i=n.extensions[this.name].emissiveStrength;return i!==void 0&&(t.emissiveIntensity=i),Promise.resolve()}}class Ut{constructor(e){this.parser=e,this.name=g.KHR_MATERIALS_CLEARCOAT}getMaterialType(e){const s=this.parser.json.materials[e];return!s.extensions||!s.extensions[this.name]?null:S}extendMaterialParams(e,t){const s=this.parser,n=s.json.materials[e];if(!n.extensions||!n.extensions[this.name])return Promise.resolve();const i=[],r=n.extensions[this.name];if(r.clearcoatFactor!==void 0&&(t.clearcoat=r.clearcoatFactor),r.clearcoatTexture!==void 0&&i.push(s.assignTexture(t,"clearcoatMap",r.clearcoatTexture)),r.clearcoatRoughnessFactor!==void 0&&(t.clearcoatRoughness=r.clearcoatRoughnessFactor),r.clearcoatRoughnessTexture!==void 0&&i.push(s.assignTexture(t,"clearcoatRoughnessMap",r.clearcoatRoughnessTexture)),r.clearcoatNormalTexture!==void 0&&(i.push(s.assignTexture(t,"clearcoatNormalMap",r.clearcoatNormalTexture)),r.clearcoatNormalTexture.scale!==void 0)){const o=r.clearcoatNormalTexture.scale;t.clearcoatNormalScale=new He(o,o)}return Promise.all(i)}}class Ft{constructor(e){this.parser=e,this.name=g.KHR_MATERIALS_DISPERSION}getMaterialType(e){const s=this.parser.json.materials[e];return!s.extensions||!s.extensions[this.name]?null:S}extendMaterialParams(e,t){const n=this.parser.json.materials[e];if(!n.extensions||!n.extensions[this.name])return Promise.resolve();const i=n.extensions[this.name];return t.dispersion=i.dispersion!==void 0?i.dispersion:0,Promise.resolve()}}class Bt{constructor(e){this.parser=e,this.name=g.KHR_MATERIALS_IRIDESCENCE}getMaterialType(e){const s=this.parser.json.materials[e];return!s.extensions||!s.extensions[this.name]?null:S}extendMaterialParams(e,t){const s=this.parser,n=s.json.materials[e];if(!n.extensions||!n.extensions[this.name])return Promise.resolve();const i=[],r=n.extensions[this.name];return r.iridescenceFactor!==void 0&&(t.iridescence=r.iridescenceFactor),r.iridescenceTexture!==void 0&&i.push(s.assignTexture(t,"iridescenceMap",r.iridescenceTexture)),r.iridescenceIor!==void 0&&(t.iridescenceIOR=r.iridescenceIor),t.iridescenceThicknessRange===void 0&&(t.iridescenceThicknessRange=[100,400]),r.iridescenceThicknessMinimum!==void 0&&(t.iridescenceThicknessRange[0]=r.iridescenceThicknessMinimum),r.iridescenceThicknessMaximum!==void 0&&(t.iridescenceThicknessRange[1]=r.iridescenceThicknessMaximum),r.iridescenceThicknessTexture!==void 0&&i.push(s.assignTexture(t,"iridescenceThicknessMap",r.iridescenceThicknessTexture)),Promise.all(i)}}class Gt{constructor(e){this.parser=e,this.name=g.KHR_MATERIALS_SHEEN}getMaterialType(e){const s=this.parser.json.materials[e];return!s.extensions||!s.extensions[this.name]?null:S}extendMaterialParams(e,t){const s=this.parser,n=s.json.materials[e];if(!n.extensions||!n.extensions[this.name])return Promise.resolve();const i=[];t.sheenColor=new U(0,0,0),t.sheenRoughness=0,t.sheen=1;const r=n.extensions[this.name];if(r.sheenColorFactor!==void 0){const o=r.sheenColorFactor;t.sheenColor.setRGB(o[0],o[1],o[2],N)}return r.sheenRoughnessFactor!==void 0&&(t.sheenRoughness=r.sheenRoughnessFactor),r.sheenColorTexture!==void 0&&i.push(s.assignTexture(t,"sheenColorMap",r.sheenColorTexture,W)),r.sheenRoughnessTexture!==void 0&&i.push(s.assignTexture(t,"sheenRoughnessMap",r.sheenRoughnessTexture)),Promise.all(i)}}class jt{constructor(e){this.parser=e,this.name=g.KHR_MATERIALS_TRANSMISSION}getMaterialType(e){const s=this.parser.json.materials[e];return!s.extensions||!s.extensions[this.name]?null:S}extendMaterialParams(e,t){const s=this.parser,n=s.json.materials[e];if(!n.extensions||!n.extensions[this.name])return Promise.resolve();const i=[],r=n.extensions[this.name];return r.transmissionFactor!==void 0&&(t.transmission=r.transmissionFactor),r.transmissionTexture!==void 0&&i.push(s.assignTexture(t,"transmissionMap",r.transmissionTexture)),Promise.all(i)}}class Vt{constructor(e){this.parser=e,this.name=g.KHR_MATERIALS_VOLUME}getMaterialType(e){const s=this.parser.json.materials[e];return!s.extensions||!s.extensions[this.name]?null:S}extendMaterialParams(e,t){const s=this.parser,n=s.json.materials[e];if(!n.extensions||!n.extensions[this.name])return Promise.resolve();const i=[],r=n.extensions[this.name];t.thickness=r.thicknessFactor!==void 0?r.thicknessFactor:0,r.thicknessTexture!==void 0&&i.push(s.assignTexture(t,"thicknessMap",r.thicknessTexture)),t.attenuationDistance=r.attenuationDistance||1/0;const o=r.attenuationColor||[1,1,1];return t.attenuationColor=new U().setRGB(o[0],o[1],o[2],N),Promise.all(i)}}class Kt{constructor(e){this.parser=e,this.name=g.KHR_MATERIALS_IOR}getMaterialType(e){const s=this.parser.json.materials[e];return!s.extensions||!s.extensions[this.name]?null:S}extendMaterialParams(e,t){const n=this.parser.json.materials[e];if(!n.extensions||!n.extensions[this.name])return Promise.resolve();const i=n.extensions[this.name];return t.ior=i.ior!==void 0?i.ior:1.5,Promise.resolve()}}class zt{constructor(e){this.parser=e,this.name=g.KHR_MATERIALS_SPECULAR}getMaterialType(e){const s=this.parser.json.materials[e];return!s.extensions||!s.extensions[this.name]?null:S}extendMaterialParams(e,t){const s=this.parser,n=s.json.materials[e];if(!n.extensions||!n.extensions[this.name])return Promise.resolve();const i=[],r=n.extensions[this.name];t.specularIntensity=r.specularFactor!==void 0?r.specularFactor:1,r.specularTexture!==void 0&&i.push(s.assignTexture(t,"specularIntensityMap",r.specularTexture));const o=r.specularColorFactor||[1,1,1];return t.specularColor=new U().setRGB(o[0],o[1],o[2],N),r.specularColorTexture!==void 0&&i.push(s.assignTexture(t,"specularColorMap",r.specularColorTexture,W)),Promise.all(i)}}class Xt{constructor(e){this.parser=e,this.name=g.EXT_MATERIALS_BUMP}getMaterialType(e){const s=this.parser.json.materials[e];return!s.extensions||!s.extensions[this.name]?null:S}extendMaterialParams(e,t){const s=this.parser,n=s.json.materials[e];if(!n.extensions||!n.extensions[this.name])return Promise.resolve();const i=[],r=n.extensions[this.name];return t.bumpScale=r.bumpFactor!==void 0?r.bumpFactor:1,r.bumpTexture!==void 0&&i.push(s.assignTexture(t,"bumpMap",r.bumpTexture)),Promise.all(i)}}class qt{constructor(e){this.parser=e,this.name=g.KHR_MATERIALS_ANISOTROPY}getMaterialType(e){const s=this.parser.json.materials[e];return!s.extensions||!s.extensions[this.name]?null:S}extendMaterialParams(e,t){const s=this.parser,n=s.json.materials[e];if(!n.extensions||!n.extensions[this.name])return Promise.resolve();const i=[],r=n.extensions[this.name];return r.anisotropyStrength!==void 0&&(t.anisotropy=r.anisotropyStrength),r.anisotropyRotation!==void 0&&(t.anisotropyRotation=r.anisotropyRotation),r.anisotropyTexture!==void 0&&i.push(s.assignTexture(t,"anisotropyMap",r.anisotropyTexture)),Promise.all(i)}}class Wt{constructor(e){this.parser=e,this.name=g.KHR_TEXTURE_BASISU}loadTexture(e){const t=this.parser,s=t.json,n=s.textures[e];if(!n.extensions||!n.extensions[this.name])return null;const i=n.extensions[this.name],r=t.options.ktx2Loader;if(!r){if(s.extensionsRequired&&s.extensionsRequired.indexOf(this.name)>=0)throw new Error("THREE.GLTFLoader: setKTX2Loader must be called before loading KTX2 textures");return null}return t.loadTextureImage(e,i.source,r)}}class Jt{constructor(e){this.parser=e,this.name=g.EXT_TEXTURE_WEBP,this.isSupported=null}loadTexture(e){const t=this.name,s=this.parser,n=s.json,i=n.textures[e];if(!i.extensions||!i.extensions[t])return null;const r=i.extensions[t],o=n.images[r.source];let a=s.textureLoader;if(o.uri){const c=s.options.manager.getHandler(o.uri);c!==null&&(a=c)}return this.detectSupport().then(function(c){if(c)return s.loadTextureImage(e,r.source,a);if(n.extensionsRequired&&n.extensionsRequired.indexOf(t)>=0)throw new Error("THREE.GLTFLoader: WebP required by asset but unsupported.");return s.loadTexture(e)})}detectSupport(){return this.isSupported||(this.isSupported=new Promise(function(e){const t=new Image;t.src="data:image/webp;base64,UklGRiIAAABXRUJQVlA4IBYAAAAwAQCdASoBAAEADsD+JaQAA3AAAAAA",t.onload=t.onerror=function(){e(t.height===1)}})),this.isSupported}}class $t{constructor(e){this.parser=e,this.name=g.EXT_TEXTURE_AVIF,this.isSupported=null}loadTexture(e){const t=this.name,s=this.parser,n=s.json,i=n.textures[e];if(!i.extensions||!i.extensions[t])return null;const r=i.extensions[t],o=n.images[r.source];let a=s.textureLoader;if(o.uri){const c=s.options.manager.getHandler(o.uri);c!==null&&(a=c)}return this.detectSupport().then(function(c){if(c)return s.loadTextureImage(e,r.source,a);if(n.extensionsRequired&&n.extensionsRequired.indexOf(t)>=0)throw new Error("THREE.GLTFLoader: AVIF required by asset but unsupported.");return s.loadTexture(e)})}detectSupport(){return this.isSupported||(this.isSupported=new Promise(function(e){const t=new Image;t.src="data:image/avif;base64,AAAAIGZ0eXBhdmlmAAAAAGF2aWZtaWYxbWlhZk1BMUIAAADybWV0YQAAAAAAAAAoaGRscgAAAAAAAAAAcGljdAAAAAAAAAAAAAAAAGxpYmF2aWYAAAAADnBpdG0AAAAAAAEAAAAeaWxvYwAAAABEAAABAAEAAAABAAABGgAAABcAAAAoaWluZgAAAAAAAQAAABppbmZlAgAAAAABAABhdjAxQ29sb3IAAAAAamlwcnAAAABLaXBjbwAAABRpc3BlAAAAAAAAAAEAAAABAAAAEHBpeGkAAAAAAwgICAAAAAxhdjFDgQAMAAAAABNjb2xybmNseAACAAIABoAAAAAXaXBtYQAAAAAAAAABAAEEAQKDBAAAAB9tZGF0EgAKCBgABogQEDQgMgkQAAAAB8dSLfI=",t.onload=t.onerror=function(){e(t.height===1)}})),this.isSupported}}class Yt{constructor(e){this.name=g.EXT_MESHOPT_COMPRESSION,this.parser=e}loadBufferView(e){const t=this.parser.json,s=t.bufferViews[e];if(s.extensions&&s.extensions[this.name]){const n=s.extensions[this.name],i=this.parser.getDependency("buffer",n.buffer),r=this.parser.options.meshoptDecoder;if(!r||!r.supported){if(t.extensionsRequired&&t.extensionsRequired.indexOf(this.name)>=0)throw new Error("THREE.GLTFLoader: setMeshoptDecoder must be called before loading compressed files");return null}return i.then(function(o){const a=n.byteOffset||0,c=n.byteLength||0,h=n.count,l=n.byteStride,u=new Uint8Array(o,a,c);return r.decodeGltfBufferAsync?r.decodeGltfBufferAsync(h,l,u,n.mode,n.filter).then(function(p){return p.buffer}):r.ready.then(function(){const p=new ArrayBuffer(h*l);return r.decodeGltfBuffer(new Uint8Array(p),h,l,u,n.mode,n.filter),p})})}else return null}}class Qt{constructor(e){this.name=g.EXT_MESH_GPU_INSTANCING,this.parser=e}createNodeMesh(e){const t=this.parser.json,s=t.nodes[e];if(!s.extensions||!s.extensions[this.name]||s.mesh===void 0)return null;const n=t.meshes[s.mesh];for(const c of n.primitives)if(c.mode!==_.TRIANGLES&&c.mode!==_.TRIANGLE_STRIP&&c.mode!==_.TRIANGLE_FAN&&c.mode!==void 0)return null;const r=s.extensions[this.name].attributes,o=[],a={};for(const c in r)o.push(this.parser.getDependency("accessor",r[c]).then(h=>(a[c]=h,a[c])));return o.length<1?null:(o.push(this.parser.createNodeMesh(e)),Promise.all(o).then(c=>{const h=c.pop(),l=h.isGroup?h.children:[h],u=c[0].count,p=[];for(const m of l){const b=new q,f=new v,x=new J,A=new v(1,1,1),E=new Se(m.geometry,m.material,u);for(let y=0;y<u;y++)a.TRANSLATION&&f.fromBufferAttribute(a.TRANSLATION,y),a.ROTATION&&x.fromBufferAttribute(a.ROTATION,y),a.SCALE&&A.fromBufferAttribute(a.SCALE,y),E.setMatrixAt(y,b.compose(f,x,A));for(const y in a)if(y==="_COLOR_0"){const L=a[y];E.instanceColor=new ze(L.array,L.itemSize,L.normalized)}else y!=="TRANSLATION"&&y!=="ROTATION"&&y!=="SCALE"&&m.geometry.setAttribute(y,a[y]);ce.prototype.copy.call(E,m),this.parser.assignFinalMaterial(E),p.push(E)}return h.isGroup?(h.clear(),h.add(...p),h):p[0]}))}}const Oe="glTF",K=12,ye={JSON:1313821514,BIN:5130562};class Zt{constructor(e){this.name=g.KHR_BINARY_GLTF,this.content=null,this.body=null;const t=new DataView(e,0,K),s=new TextDecoder;if(this.header={magic:s.decode(new Uint8Array(e.slice(0,4))),version:t.getUint32(4,!0),length:t.getUint32(8,!0)},this.header.magic!==Oe)throw new Error("THREE.GLTFLoader: Unsupported glTF-Binary header.");if(this.header.version<2)throw new Error("THREE.GLTFLoader: Legacy binary file detected.");const n=this.header.length-K,i=new DataView(e,K);let r=0;for(;r<n;){const o=i.getUint32(r,!0);r+=4;const a=i.getUint32(r,!0);if(r+=4,a===ye.JSON){const c=new Uint8Array(e,K+r,o);this.content=s.decode(c)}else if(a===ye.BIN){const c=K+r;this.body=e.slice(c,c+o)}r+=o}if(this.content===null)throw new Error("THREE.GLTFLoader: JSON content not found.")}}class en{constructor(e,t){if(!t)throw new Error("THREE.GLTFLoader: No DRACOLoader instance provided.");this.name=g.KHR_DRACO_MESH_COMPRESSION,this.json=e,this.dracoLoader=t,this.dracoLoader.preload()}decodePrimitive(e,t){const s=this.json,n=this.dracoLoader,i=e.extensions[this.name].bufferView,r=e.extensions[this.name].attributes,o={},a={},c={};for(const h in r){const l=ae[h]||h.toLowerCase();o[l]=r[h]}for(const h in e.attributes){const l=ae[h]||h.toLowerCase();if(r[h]!==void 0){const u=s.accessors[e.attributes[h]],p=j[u.componentType];c[l]=p.name,a[l]=u.normalized===!0}}return t.getDependency("bufferView",i).then(function(h){return new Promise(function(l,u){n.decodeDracoFile(h,function(p){for(const m in p.attributes){const b=p.attributes[m],f=a[m];f!==void 0&&(b.normalized=f)}l(p)},o,c,N,u)})})}}class tn{constructor(){this.name=g.KHR_TEXTURE_TRANSFORM}extendTexture(e,t){return(t.texCoord===void 0||t.texCoord===e.channel)&&t.offset===void 0&&t.rotation===void 0&&t.scale===void 0||(e=e.clone(),t.texCoord!==void 0&&(e.channel=t.texCoord),t.offset!==void 0&&e.offset.fromArray(t.offset),t.rotation!==void 0&&(e.rotation=t.rotation),t.scale!==void 0&&e.repeat.fromArray(t.scale),e.needsUpdate=!0),e}}class nn{constructor(){this.name=g.KHR_MESH_QUANTIZATION}}class Ue extends yt{constructor(e,t,s,n){super(e,t,s,n)}copySampleValue_(e){const t=this.resultBuffer,s=this.sampleValues,n=this.valueSize,i=e*n*3+n;for(let r=0;r!==n;r++)t[r]=s[i+r];return t}interpolate_(e,t,s,n){const i=this.resultBuffer,r=this.sampleValues,o=this.valueSize,a=o*2,c=o*3,h=n-t,l=(s-t)/h,u=l*l,p=u*l,m=e*c,b=m-c,f=-2*p+3*u,x=p-u,A=1-f,E=x-u+l;for(let y=0;y!==o;y++){const L=r[b+y+o],H=r[b+y+a]*h,M=r[m+y+o],V=r[m+y]*h;i[y]=A*L+E*H+f*M+x*V}return i}}const sn=new J;class rn extends Ue{interpolate_(e,t,s,n){const i=super.interpolate_(e,t,s,n);return sn.fromArray(i).normalize().toArray(i),i}}const _={POINTS:0,LINES:1,LINE_LOOP:2,LINE_STRIP:3,TRIANGLES:4,TRIANGLE_STRIP:5,TRIANGLE_FAN:6},j={5120:Int8Array,5121:Uint8Array,5122:Int16Array,5123:Uint16Array,5125:Uint32Array,5126:Float32Array},Ae={9728:Pe,9729:ie,9984:Ye,9985:$e,9986:Je,9987:De},Te={33071:Ze,33648:Qe,10497:re},ee={SCALAR:1,VEC2:2,VEC3:3,VEC4:4,MAT2:4,MAT3:9,MAT4:16},ae={POSITION:"position",NORMAL:"normal",TANGENT:"tangent",TEXCOORD_0:"uv",TEXCOORD_1:"uv1",TEXCOORD_2:"uv2",TEXCOORD_3:"uv3",COLOR_0:"color",WEIGHTS_0:"skinWeight",JOINTS_0:"skinIndex"},P={scale:"scale",translation:"position",rotation:"quaternion",weights:"morphTargetInfluences"},an={CUBICSPLINE:void 0,LINEAR:ke,STEP:gt},te={OPAQUE:"OPAQUE",MASK:"MASK",BLEND:"BLEND"};function on(d){return d.DefaultMaterial===void 0&&(d.DefaultMaterial=new G({color:16777215,emissive:0,metalness:1,roughness:1,transparent:!1,depthTest:!0,side:bt})),d.DefaultMaterial}function O(d,e,t){for(const s in t.extensions)d[s]===void 0&&(e.userData.gltfExtensions=e.userData.gltfExtensions||{},e.userData.gltfExtensions[s]=t.extensions[s])}function C(d,e){e.extras!==void 0&&(typeof e.extras=="object"?Object.assign(d.userData,e.extras):console.warn("THREE.GLTFLoader: Ignoring primitive type .extras, "+e.extras))}function cn(d,e,t){let s=!1,n=!1,i=!1;for(let c=0,h=e.length;c<h;c++){const l=e[c];if(l.POSITION!==void 0&&(s=!0),l.NORMAL!==void 0&&(n=!0),l.COLOR_0!==void 0&&(i=!0),s&&n&&i)break}if(!s&&!n&&!i)return Promise.resolve(d);const r=[],o=[],a=[];for(let c=0,h=e.length;c<h;c++){const l=e[c];if(s){const u=l.POSITION!==void 0?t.getDependency("accessor",l.POSITION):d.attributes.position;r.push(u)}if(n){const u=l.NORMAL!==void 0?t.getDependency("accessor",l.NORMAL):d.attributes.normal;o.push(u)}if(i){const u=l.COLOR_0!==void 0?t.getDependency("accessor",l.COLOR_0):d.attributes.color;a.push(u)}}return Promise.all([Promise.all(r),Promise.all(o),Promise.all(a)]).then(function(c){const h=c[0],l=c[1],u=c[2];return s&&(d.morphAttributes.position=h),n&&(d.morphAttributes.normal=l),i&&(d.morphAttributes.color=u),d.morphTargetsRelative=!0,d})}function ln(d,e){if(d.updateMorphTargets(),e.weights!==void 0)for(let t=0,s=e.weights.length;t<s;t++)d.morphTargetInfluences[t]=e.weights[t];if(e.extras&&Array.isArray(e.extras.targetNames)){const t=e.extras.targetNames;if(d.morphTargetInfluences.length===t.length){d.morphTargetDictionary={};for(let s=0,n=t.length;s<n;s++)d.morphTargetDictionary[t[s]]=s}else console.warn("THREE.GLTFLoader: Invalid extras.targetNames length. Ignoring names.")}}function dn(d){let e;const t=d.extensions&&d.extensions[g.KHR_DRACO_MESH_COMPRESSION];if(t?e="draco:"+t.bufferView+":"+t.indices+":"+ne(t.attributes):e=d.indices+":"+ne(d.attributes)+":"+d.mode,d.targets!==void 0)for(let s=0,n=d.targets.length;s<n;s++)e+=":"+ne(d.targets[s]);return e}function ne(d){let e="";const t=Object.keys(d).sort();for(let s=0,n=t.length;s<n;s++)e+=t[s]+":"+d[t[s]]+";";return e}function oe(d){switch(d){case Int8Array:return 1/127;case Uint8Array:return 1/255;case Int16Array:return 1/32767;case Uint16Array:return 1/65535;default:throw new Error("THREE.GLTFLoader: Unsupported normalized accessor component type.")}}function hn(d){return d.search(/\.jpe?g($|\?)/i)>0||d.search(/^data\:image\/jpeg/)===0?"image/jpeg":d.search(/\.webp($|\?)/i)>0||d.search(/^data\:image\/webp/)===0?"image/webp":d.search(/\.ktx2($|\?)/i)>0||d.search(/^data\:image\/ktx2/)===0?"image/ktx2":"image/png"}const un=new q;class pn{constructor(e={},t={}){this.json=e,this.extensions={},this.plugins={},this.options=t,this.cache=new Dt,this.associations=new Map,this.primitiveCache={},this.nodeCache={},this.meshCache={refs:{},uses:{}},this.cameraCache={refs:{},uses:{}},this.lightCache={refs:{},uses:{}},this.sourceCache={},this.textureCache={},this.nodeNamesUsed={};let s=!1,n=-1,i=!1,r=-1;if(typeof navigator<"u"){const o=navigator.userAgent;s=/^((?!chrome|android).)*safari/i.test(o)===!0;const a=o.match(/Version\/(\d+)/);n=s&&a?parseInt(a[1],10):-1,i=o.indexOf("Firefox")>-1,r=i?o.match(/Firefox\/([0-9]+)\./)[1]:-1}typeof createImageBitmap>"u"||s&&n<17||i&&r<98?this.textureLoader=new Xe(this.options.manager):this.textureLoader=new qe(this.options.manager),this.textureLoader.setCrossOrigin(this.options.crossOrigin),this.textureLoader.setRequestHeader(this.options.requestHeader),this.fileLoader=new Ne(this.options.manager),this.fileLoader.setResponseType("arraybuffer"),this.options.crossOrigin==="use-credentials"&&this.fileLoader.setWithCredentials(!0)}setExtensions(e){this.extensions=e}setPlugins(e){this.plugins=e}parse(e,t){const s=this,n=this.json,i=this.extensions;this.cache.removeAll(),this.nodeCache={},this._invokeAll(function(r){return r._markDefs&&r._markDefs()}),Promise.all(this._invokeAll(function(r){return r.beforeRoot&&r.beforeRoot()})).then(function(){return Promise.all([s.getDependencies("scene"),s.getDependencies("animation"),s.getDependencies("camera")])}).then(function(r){const o={scene:r[0][n.scene||0],scenes:r[0],animations:r[1],cameras:r[2],asset:n.asset,parser:s,userData:{}};return O(i,o,n),C(o,n),Promise.all(s._invokeAll(function(a){return a.afterRoot&&a.afterRoot(o)})).then(function(){for(const a of o.scenes)a.updateMatrixWorld();e(o)})}).catch(t)}_markDefs(){const e=this.json.nodes||[],t=this.json.skins||[],s=this.json.meshes||[];for(let n=0,i=t.length;n<i;n++){const r=t[n].joints;for(let o=0,a=r.length;o<a;o++)e[r[o]].isBone=!0}for(let n=0,i=e.length;n<i;n++){const r=e[n];r.mesh!==void 0&&(this._addNodeRef(this.meshCache,r.mesh),r.skin!==void 0&&(s[r.mesh].isSkinnedMesh=!0)),r.camera!==void 0&&this._addNodeRef(this.cameraCache,r.camera)}}_addNodeRef(e,t){t!==void 0&&(e.refs[t]===void 0&&(e.refs[t]=e.uses[t]=0),e.refs[t]++)}_getNodeRef(e,t,s){if(e.refs[t]<=1)return s;const n=s.clone(),i=(r,o)=>{const a=this.associations.get(r);a!=null&&this.associations.set(o,a);for(const[c,h]of r.children.entries())i(h,o.children[c])};return i(s,n),n.name+="_instance_"+e.uses[t]++,n}_invokeOne(e){const t=Object.values(this.plugins);t.push(this);for(let s=0;s<t.length;s++){const n=e(t[s]);if(n)return n}return null}_invokeAll(e){const t=Object.values(this.plugins);t.unshift(this);const s=[];for(let n=0;n<t.length;n++){const i=e(t[n]);i&&s.push(i)}return s}getDependency(e,t){const s=e+":"+t;let n=this.cache.get(s);if(!n){switch(e){case"scene":n=this.loadScene(t);break;case"node":n=this._invokeOne(function(i){return i.loadNode&&i.loadNode(t)});break;case"mesh":n=this._invokeOne(function(i){return i.loadMesh&&i.loadMesh(t)});break;case"accessor":n=this.loadAccessor(t);break;case"bufferView":n=this._invokeOne(function(i){return i.loadBufferView&&i.loadBufferView(t)});break;case"buffer":n=this.loadBuffer(t);break;case"material":n=this._invokeOne(function(i){return i.loadMaterial&&i.loadMaterial(t)});break;case"texture":n=this._invokeOne(function(i){return i.loadTexture&&i.loadTexture(t)});break;case"skin":n=this.loadSkin(t);break;case"animation":n=this._invokeOne(function(i){return i.loadAnimation&&i.loadAnimation(t)});break;case"camera":n=this.loadCamera(t);break;default:if(n=this._invokeOne(function(i){return i!=this&&i.getDependency&&i.getDependency(e,t)}),!n)throw new Error("Unknown type: "+e);break}this.cache.add(s,n)}return n}getDependencies(e){let t=this.cache.get(e);if(!t){const s=this,n=this.json[e+(e==="mesh"?"es":"s")]||[];t=Promise.all(n.map(function(i,r){return s.getDependency(e,r)})),this.cache.add(e,t)}return t}loadBuffer(e){const t=this.json.buffers[e],s=this.fileLoader;if(t.type&&t.type!=="arraybuffer")throw new Error("THREE.GLTFLoader: "+t.type+" buffer type is not supported.");if(t.uri===void 0&&e===0)return Promise.resolve(this.extensions[g.KHR_BINARY_GLTF].body);const n=this.options;return new Promise(function(i,r){s.load(X.resolveURL(t.uri,n.path),i,void 0,function(){r(new Error('THREE.GLTFLoader: Failed to load buffer "'+t.uri+'".'))})})}loadBufferView(e){const t=this.json.bufferViews[e];return this.getDependency("buffer",t.buffer).then(function(s){const n=t.byteLength||0,i=t.byteOffset||0;return s.slice(i,i+n)})}loadAccessor(e){const t=this,s=this.json,n=this.json.accessors[e];if(n.bufferView===void 0&&n.sparse===void 0){const r=ee[n.type],o=j[n.componentType],a=n.normalized===!0,c=new o(n.count*r);return Promise.resolve(new Q(c,r,a))}const i=[];return n.bufferView!==void 0?i.push(this.getDependency("bufferView",n.bufferView)):i.push(null),n.sparse!==void 0&&(i.push(this.getDependency("bufferView",n.sparse.indices.bufferView)),i.push(this.getDependency("bufferView",n.sparse.values.bufferView))),Promise.all(i).then(function(r){const o=r[0],a=ee[n.type],c=j[n.componentType],h=c.BYTES_PER_ELEMENT,l=h*a,u=n.byteOffset||0,p=n.bufferView!==void 0?s.bufferViews[n.bufferView].byteStride:void 0,m=n.normalized===!0;let b,f;if(p&&p!==l){const x=Math.floor(u/p),A="InterleavedBuffer:"+n.bufferView+":"+n.componentType+":"+x+":"+n.count;let E=t.cache.get(A);E||(b=new c(o,x*p,n.count*p/h),E=new We(b,p/h),t.cache.add(A,E)),f=new xt(E,a,u%p/h,m)}else o===null?b=new c(n.count*a):b=new c(o,u,n.count*a),f=new Q(b,a,m);if(n.sparse!==void 0){const x=ee.SCALAR,A=j[n.sparse.indices.componentType],E=n.sparse.indices.byteOffset||0,y=n.sparse.values.byteOffset||0,L=new A(r[1],E,n.sparse.count*x),H=new c(r[2],y,n.sparse.count*a);o!==null&&(f=new Q(f.array.slice(),f.itemSize,f.normalized)),f.normalized=!1;for(let M=0,V=L.length;M<V;M++){const D=L[M];if(f.setX(D,H[M*a]),a>=2&&f.setY(D,H[M*a+1]),a>=3&&f.setZ(D,H[M*a+2]),a>=4&&f.setW(D,H[M*a+3]),a>=5)throw new Error("THREE.GLTFLoader: Unsupported itemSize in sparse BufferAttribute.")}f.normalized=m}return f})}loadTexture(e){const t=this.json,s=this.options,i=t.textures[e].source,r=t.images[i];let o=this.textureLoader;if(r.uri){const a=s.manager.getHandler(r.uri);a!==null&&(o=a)}return this.loadTextureImage(e,i,o)}loadTextureImage(e,t,s){const n=this,i=this.json,r=i.textures[e],o=i.images[t],a=(o.uri||o.bufferView)+":"+r.sampler;if(this.textureCache[a])return this.textureCache[a];const c=this.loadImageSource(t,s).then(function(h){h.flipY=!1,h.name=r.name||o.name||"",h.name===""&&typeof o.uri=="string"&&o.uri.startsWith("data:image/")===!1&&(h.name=o.uri);const u=(i.samplers||{})[r.sampler]||{};return h.magFilter=Ae[u.magFilter]||ie,h.minFilter=Ae[u.minFilter]||De,h.wrapS=Te[u.wrapS]||re,h.wrapT=Te[u.wrapT]||re,h.generateMipmaps=!h.isCompressedTexture&&h.minFilter!==Pe&&h.minFilter!==ie,n.associations.set(h,{textures:e}),h}).catch(function(){return null});return this.textureCache[a]=c,c}loadImageSource(e,t){const s=this,n=this.json,i=this.options;if(this.sourceCache[e]!==void 0)return this.sourceCache[e].then(l=>l.clone());const r=n.images[e],o=self.URL||self.webkitURL;let a=r.uri||"",c=!1;if(r.bufferView!==void 0)a=s.getDependency("bufferView",r.bufferView).then(function(l){c=!0;const u=new Blob([l],{type:r.mimeType});return a=o.createObjectURL(u),a});else if(r.uri===void 0)throw new Error("THREE.GLTFLoader: Image "+e+" is missing URI and bufferView");const h=Promise.resolve(a).then(function(l){return new Promise(function(u,p){let m=u;t.isImageBitmapLoader===!0&&(m=function(b){const f=new de(b);f.needsUpdate=!0,u(f)}),t.load(X.resolveURL(l,i.path),m,void 0,p)})}).then(function(l){return c===!0&&o.revokeObjectURL(a),C(l,r),l.userData.mimeType=r.mimeType||hn(r.uri),l}).catch(function(l){throw console.error("THREE.GLTFLoader: Couldn't load texture",a),l});return this.sourceCache[e]=h,h}assignTexture(e,t,s,n){const i=this;return this.getDependency("texture",s.index).then(function(r){if(!r)return null;if(s.texCoord!==void 0&&s.texCoord>0&&(r=r.clone(),r.channel=s.texCoord),i.extensions[g.KHR_TEXTURE_TRANSFORM]){const o=s.extensions!==void 0?s.extensions[g.KHR_TEXTURE_TRANSFORM]:void 0;if(o){const a=i.associations.get(r);r=i.extensions[g.KHR_TEXTURE_TRANSFORM].extendTexture(r,o),i.associations.set(r,a)}}return n!==void 0&&(r.colorSpace=n),e[t]=r,r})}assignFinalMaterial(e){const t=e.geometry;let s=e.material;const n=t.attributes.tangent===void 0,i=t.attributes.color!==void 0,r=t.attributes.normal===void 0;if(e.isPoints){const o="PointsMaterial:"+s.uuid;let a=this.cache.get(o);a||(a=new et,Z.prototype.copy.call(a,s),a.color.copy(s.color),a.map=s.map,a.sizeAttenuation=!1,this.cache.add(o,a)),s=a}else if(e.isLine){const o="LineBasicMaterial:"+s.uuid;let a=this.cache.get(o);a||(a=new tt,Z.prototype.copy.call(a,s),a.color.copy(s.color),a.map=s.map,this.cache.add(o,a)),s=a}if(n||i||r){let o="ClonedMaterial:"+s.uuid+":";n&&(o+="derivative-tangents:"),i&&(o+="vertex-colors:"),r&&(o+="flat-shading:");let a=this.cache.get(o);a||(a=s.clone(),i&&(a.vertexColors=!0),r&&(a.flatShading=!0),n&&(a.normalScale&&(a.normalScale.y*=-1),a.clearcoatNormalScale&&(a.clearcoatNormalScale.y*=-1)),this.cache.add(o,a),this.associations.set(a,this.associations.get(s))),s=a}e.material=s}getMaterialType(){return G}loadMaterial(e){const t=this,s=this.json,n=this.extensions,i=s.materials[e];let r;const o={},a=i.extensions||{},c=[];if(a[g.KHR_MATERIALS_UNLIT]){const l=n[g.KHR_MATERIALS_UNLIT];r=l.getMaterialType(),c.push(l.extendParams(o,i,t))}else{const l=i.pbrMetallicRoughness||{};if(o.color=new U(1,1,1),o.opacity=1,Array.isArray(l.baseColorFactor)){const u=l.baseColorFactor;o.color.setRGB(u[0],u[1],u[2],N),o.opacity=u[3]}l.baseColorTexture!==void 0&&c.push(t.assignTexture(o,"map",l.baseColorTexture,W)),o.metalness=l.metallicFactor!==void 0?l.metallicFactor:1,o.roughness=l.roughnessFactor!==void 0?l.roughnessFactor:1,l.metallicRoughnessTexture!==void 0&&(c.push(t.assignTexture(o,"metalnessMap",l.metallicRoughnessTexture)),c.push(t.assignTexture(o,"roughnessMap",l.metallicRoughnessTexture))),r=this._invokeOne(function(u){return u.getMaterialType&&u.getMaterialType(e)}),c.push(Promise.all(this._invokeAll(function(u){return u.extendMaterialParams&&u.extendMaterialParams(e,o)})))}i.doubleSided===!0&&(o.side=nt);const h=i.alphaMode||te.OPAQUE;if(h===te.BLEND?(o.transparent=!0,o.depthWrite=!1):(o.transparent=!1,h===te.MASK&&(o.alphaTest=i.alphaCutoff!==void 0?i.alphaCutoff:.5)),i.normalTexture!==void 0&&r!==B&&(c.push(t.assignTexture(o,"normalMap",i.normalTexture)),o.normalScale=new He(1,1),i.normalTexture.scale!==void 0)){const l=i.normalTexture.scale;o.normalScale.set(l,l)}if(i.occlusionTexture!==void 0&&r!==B&&(c.push(t.assignTexture(o,"aoMap",i.occlusionTexture)),i.occlusionTexture.strength!==void 0&&(o.aoMapIntensity=i.occlusionTexture.strength)),i.emissiveFactor!==void 0&&r!==B){const l=i.emissiveFactor;o.emissive=new U().setRGB(l[0],l[1],l[2],N)}return i.emissiveTexture!==void 0&&r!==B&&c.push(t.assignTexture(o,"emissiveMap",i.emissiveTexture,W)),Promise.all(c).then(function(){const l=new r(o);return i.name&&(l.name=i.name),C(l,i),t.associations.set(l,{materials:e}),i.extensions&&O(n,l,i),l})}createUniqueName(e){const t=st.sanitizeNodeName(e||"");return t in this.nodeNamesUsed?t+"_"+ ++this.nodeNamesUsed[t]:(this.nodeNamesUsed[t]=0,t)}loadGeometries(e){const t=this,s=this.extensions,n=this.primitiveCache;function i(o){return s[g.KHR_DRACO_MESH_COMPRESSION].decodePrimitive(o,t).then(function(a){return Re(a,o,t)})}const r=[];for(let o=0,a=e.length;o<a;o++){const c=e[o],h=dn(c),l=n[h];if(l)r.push(l.promise);else{let u;c.extensions&&c.extensions[g.KHR_DRACO_MESH_COMPRESSION]?u=i(c):u=Re(new it,c,t),n[h]={primitive:c,promise:u},r.push(u)}}return Promise.all(r)}loadMesh(e){const t=this,s=this.json,n=this.extensions,i=s.meshes[e],r=i.primitives,o=[];for(let a=0,c=r.length;a<c;a++){const h=r[a].material===void 0?on(this.cache):this.getDependency("material",r[a].material);o.push(h)}return o.push(t.loadGeometries(r)),Promise.all(o).then(function(a){const c=a.slice(0,a.length-1),h=a[a.length-1],l=[];for(let p=0,m=h.length;p<m;p++){const b=h[p],f=r[p];let x;const A=c[p];if(f.mode===_.TRIANGLES||f.mode===_.TRIANGLE_STRIP||f.mode===_.TRIANGLE_FAN||f.mode===void 0)x=i.isSkinnedMesh===!0?new rt(b,A):new z(b,A),x.isSkinnedMesh===!0&&x.normalizeSkinWeights(),f.mode===_.TRIANGLE_STRIP?x.geometry=be(x.geometry,Ce):f.mode===_.TRIANGLE_FAN&&(x.geometry=be(x.geometry,se));else if(f.mode===_.LINES)x=new at(b,A);else if(f.mode===_.LINE_STRIP)x=new ot(b,A);else if(f.mode===_.LINE_LOOP)x=new ct(b,A);else if(f.mode===_.POINTS)x=new lt(b,A);else throw new Error("THREE.GLTFLoader: Primitive mode unsupported: "+f.mode);Object.keys(x.geometry.morphAttributes).length>0&&ln(x,i),x.name=t.createUniqueName(i.name||"mesh_"+e),C(x,i),f.extensions&&O(n,x,f),t.assignFinalMaterial(x),l.push(x)}for(let p=0,m=l.length;p<m;p++)t.associations.set(l[p],{meshes:e,primitives:p});if(l.length===1)return i.extensions&&O(n,l[0],i),l[0];const u=new $;i.extensions&&O(n,u,i),t.associations.set(u,{meshes:e});for(let p=0,m=l.length;p<m;p++)u.add(l[p]);return u})}loadCamera(e){let t;const s=this.json.cameras[e],n=s[s.type];if(!n){console.warn("THREE.GLTFLoader: Missing camera parameters.");return}return s.type==="perspective"?t=new dt(ht.radToDeg(n.yfov),n.aspectRatio||1,n.znear||1,n.zfar||2e6):s.type==="orthographic"&&(t=new ut(-n.xmag,n.xmag,n.ymag,-n.ymag,n.znear,n.zfar)),s.name&&(t.name=this.createUniqueName(s.name)),C(t,s),Promise.resolve(t)}loadSkin(e){const t=this.json.skins[e],s=[];for(let n=0,i=t.joints.length;n<i;n++)s.push(this._loadNodeShallow(t.joints[n]));return t.inverseBindMatrices!==void 0?s.push(this.getDependency("accessor",t.inverseBindMatrices)):s.push(null),Promise.all(s).then(function(n){const i=n.pop(),r=n,o=[],a=[];for(let c=0,h=r.length;c<h;c++){const l=r[c];if(l){o.push(l);const u=new q;i!==null&&u.fromArray(i.array,c*16),a.push(u)}else console.warn('THREE.GLTFLoader: Joint "%s" could not be found.',t.joints[c])}return new pt(o,a)})}loadAnimation(e){const t=this.json,s=this,n=t.animations[e],i=n.name?n.name:"animation_"+e,r=[],o=[],a=[],c=[],h=[];for(let l=0,u=n.channels.length;l<u;l++){const p=n.channels[l],m=n.samplers[p.sampler],b=p.target,f=b.node,x=n.parameters!==void 0?n.parameters[m.input]:m.input,A=n.parameters!==void 0?n.parameters[m.output]:m.output;b.node!==void 0&&(r.push(this.getDependency("node",f)),o.push(this.getDependency("accessor",x)),a.push(this.getDependency("accessor",A)),c.push(m),h.push(b))}return Promise.all([Promise.all(r),Promise.all(o),Promise.all(a),Promise.all(c),Promise.all(h)]).then(function(l){const u=l[0],p=l[1],m=l[2],b=l[3],f=l[4],x=[];for(let A=0,E=u.length;A<E;A++){const y=u[A],L=p[A],H=m[A],M=b[A],V=f[A];if(y===void 0)continue;y.updateMatrix&&y.updateMatrix();const D=s._createAnimationTracks(y,L,H,M,V);if(D)for(let Y=0;Y<D.length;Y++)x.push(D[Y])}return new ft(i,void 0,x)})}createNodeMesh(e){const t=this.json,s=this,n=t.nodes[e];return n.mesh===void 0?null:s.getDependency("mesh",n.mesh).then(function(i){const r=s._getNodeRef(s.meshCache,n.mesh,i);return n.weights!==void 0&&r.traverse(function(o){if(o.isMesh)for(let a=0,c=n.weights.length;a<c;a++)o.morphTargetInfluences[a]=n.weights[a]}),r})}loadNode(e){const t=this.json,s=this,n=t.nodes[e],i=s._loadNodeShallow(e),r=[],o=n.children||[];for(let c=0,h=o.length;c<h;c++)r.push(s.getDependency("node",o[c]));const a=n.skin===void 0?Promise.resolve(null):s.getDependency("skin",n.skin);return Promise.all([i,Promise.all(r),a]).then(function(c){const h=c[0],l=c[1],u=c[2];u!==null&&h.traverse(function(p){p.isSkinnedMesh&&p.bind(u,un)});for(let p=0,m=l.length;p<m;p++)h.add(l[p]);return h})}_loadNodeShallow(e){const t=this.json,s=this.extensions,n=this;if(this.nodeCache[e]!==void 0)return this.nodeCache[e];const i=t.nodes[e],r=i.name?n.createUniqueName(i.name):"",o=[],a=n._invokeOne(function(c){return c.createNodeMesh&&c.createNodeMesh(e)});return a&&o.push(a),i.camera!==void 0&&o.push(n.getDependency("camera",i.camera).then(function(c){return n._getNodeRef(n.cameraCache,i.camera,c)})),n._invokeAll(function(c){return c.createNodeAttachment&&c.createNodeAttachment(e)}).forEach(function(c){o.push(c)}),this.nodeCache[e]=Promise.all(o).then(function(c){let h;if(i.isBone===!0?h=new mt:c.length>1?h=new $:c.length===1?h=c[0]:h=new ce,h!==c[0])for(let l=0,u=c.length;l<u;l++)h.add(c[l]);if(i.name&&(h.userData.name=i.name,h.name=r),C(h,i),i.extensions&&O(s,h,i),i.matrix!==void 0){const l=new q;l.fromArray(i.matrix),h.applyMatrix4(l)}else i.translation!==void 0&&h.position.fromArray(i.translation),i.rotation!==void 0&&h.quaternion.fromArray(i.rotation),i.scale!==void 0&&h.scale.fromArray(i.scale);return n.associations.has(h)||n.associations.set(h,{}),n.associations.get(h).nodes=e,h}),this.nodeCache[e]}loadScene(e){const t=this.extensions,s=this.json.scenes[e],n=this,i=new $;s.name&&(i.name=n.createUniqueName(s.name)),C(i,s),s.extensions&&O(t,i,s);const r=s.nodes||[],o=[];for(let a=0,c=r.length;a<c;a++)o.push(n.getDependency("node",r[a]));return Promise.all(o).then(function(a){for(let h=0,l=a.length;h<l;h++)i.add(a[h]);const c=h=>{const l=new Map;for(const[u,p]of n.associations)(u instanceof Z||u instanceof de)&&l.set(u,p);return h.traverse(u=>{const p=n.associations.get(u);p!=null&&l.set(u,p)}),l};return n.associations=c(i),i})}_createAnimationTracks(e,t,s,n,i){const r=[],o=e.name?e.name:e.uuid,a=[];P[i.path]===P.weights?e.traverse(function(u){u.morphTargetInfluences&&a.push(u.name?u.name:u.uuid)}):a.push(o);let c;switch(P[i.path]){case P.weights:c=ue;break;case P.rotation:c=pe;break;case P.position:case P.scale:c=he;break;default:switch(s.itemSize){case 1:c=ue;break;case 2:case 3:default:c=he;break}break}const h=n.interpolation!==void 0?an[n.interpolation]:ke,l=this._getArrayFromAccessor(s);for(let u=0,p=a.length;u<p;u++){const m=new c(a[u]+"."+P[i.path],t.array,l,h);n.interpolation==="CUBICSPLINE"&&this._createCubicSplineTrackInterpolant(m),r.push(m)}return r}_getArrayFromAccessor(e){let t=e.array;if(e.normalized){const s=oe(t.constructor),n=new Float32Array(t.length);for(let i=0,r=t.length;i<r;i++)n[i]=t[i]*s;t=n}return t}_createCubicSplineTrackInterpolant(e){e.createInterpolant=function(s){const n=this instanceof pe?rn:Ue;return new n(this.times,this.values,this.getValueSize()/3,s)},e.createInterpolant.isInterpolantFactoryMethodGLTFCubicSpline=!0}}function fn(d,e,t){const s=e.attributes,n=new At;if(s.POSITION!==void 0){const o=t.json.accessors[s.POSITION],a=o.min,c=o.max;if(a!==void 0&&c!==void 0){if(n.set(new v(a[0],a[1],a[2]),new v(c[0],c[1],c[2])),o.normalized){const h=oe(j[o.componentType]);n.min.multiplyScalar(h),n.max.multiplyScalar(h)}}else{console.warn("THREE.GLTFLoader: Missing min/max properties for accessor POSITION.");return}}else return;const i=e.targets;if(i!==void 0){const o=new v,a=new v;for(let c=0,h=i.length;c<h;c++){const l=i[c];if(l.POSITION!==void 0){const u=t.json.accessors[l.POSITION],p=u.min,m=u.max;if(p!==void 0&&m!==void 0){if(a.setX(Math.max(Math.abs(p[0]),Math.abs(m[0]))),a.setY(Math.max(Math.abs(p[1]),Math.abs(m[1]))),a.setZ(Math.max(Math.abs(p[2]),Math.abs(m[2]))),u.normalized){const b=oe(j[u.componentType]);a.multiplyScalar(b)}o.max(a)}else console.warn("THREE.GLTFLoader: Missing min/max properties for accessor POSITION.")}}n.expandByVector(o)}d.boundingBox=n;const r=new Tt;n.getCenter(r.center),r.radius=n.min.distanceTo(n.max)/2,d.boundingSphere=r}function Re(d,e,t){const s=e.attributes,n=[];function i(r,o){return t.getDependency("accessor",r).then(function(a){d.setAttribute(o,a)})}for(const r in s){const o=ae[r]||r.toLowerCase();o in d.attributes||n.push(i(s[r],o))}if(e.indices!==void 0&&!d.index){const r=t.getDependency("accessor",e.indices).then(function(o){d.setIndex(o)});n.push(r)}return fe.workingColorSpace!==N&&"COLOR_0"in s&&console.warn(`THREE.GLTFLoader: Converting vertex colors from "srgb-linear" to "${fe.workingColorSpace}" not supported.`),C(d,e),fn(d,e,t),Promise.all(n).then(function(){return e.targets!==void 0?cn(d,e.targets,t):d})}const mn="https://cdn.jsdelivr.net/npm/@webxr-input-profiles/assets@1.0/dist/profiles/generic-hand/";class gn{constructor(e,t,s,n,i=null,r=null){this.controller=t,this.handModel=e,this.bones=[],i===null&&(i=new Ht,i.setPath(s||mn)),i.load(`${n}.glb`,o=>{const a=o.scene.children[0];this.handModel.add(a);const c=a.getObjectByProperty("type","SkinnedMesh");c.frustumCulled=!1,c.castShadow=!0,c.receiveShadow=!0,["wrist","thumb-metacarpal","thumb-phalanx-proximal","thumb-phalanx-distal","thumb-tip","index-finger-metacarpal","index-finger-phalanx-proximal","index-finger-phalanx-intermediate","index-finger-phalanx-distal","index-finger-tip","middle-finger-metacarpal","middle-finger-phalanx-proximal","middle-finger-phalanx-intermediate","middle-finger-phalanx-distal","middle-finger-tip","ring-finger-metacarpal","ring-finger-phalanx-proximal","ring-finger-phalanx-intermediate","ring-finger-phalanx-distal","ring-finger-tip","pinky-finger-metacarpal","pinky-finger-phalanx-proximal","pinky-finger-phalanx-intermediate","pinky-finger-phalanx-distal","pinky-finger-tip"].forEach(l=>{const u=a.getObjectByName(l);u!==void 0?u.jointName=l:console.warn(`Couldn't find ${l} in ${n} hand mesh`),this.bones.push(u)}),r&&r(a)})}updateMesh(){const e=this.controller.joints;for(let t=0;t<this.bones.length;t++){const s=this.bones[t];if(s){const n=e[s.jointName];if(n.visible){const i=n.position;s.position.copy(i),s.quaternion.copy(n.quaternion)}}}}}class xn extends ce{constructor(e){super(),this.controller=e,this.motionController=null,this.envMap=null,this.mesh=null}updateMatrixWorld(e){super.updateMatrixWorld(e),this.motionController&&this.motionController.updateMesh()}}class bn{constructor(e=null,t=null){this.gltfLoader=e,this.path=null,this.onLoad=t}setPath(e){return this.path=e,this}createHandModel(e,t){const s=new xn(e);return e.addEventListener("connected",n=>{const i=n.data;i.hand&&!s.motionController&&(s.xrInputSource=i,t===void 0||t==="spheres"?s.motionController=new xe(s,e,this.path,i.handedness,{primitive:"sphere"}):t==="boxes"?s.motionController=new xe(s,e,this.path,i.handedness,{primitive:"box"}):t==="mesh"&&(s.motionController=new gn(s,e,this.path,i.handedness,this.gltfLoader,this.onLoad))),e.visible=!0}),e.addEventListener("disconnected",()=>{e.visible=!1}),s}}function yn(d,e,t=!0){const s=new bn,n=[],i=[];for(let r=0;r<2;r++){const o=d.xr.getHand(r);e.add(o);const a=s.createHandModel(o,"mesh");a.visible=t,o.add(a),n.push(o),i.push(a)}return{hands:n,handModels:i}}const Ee="thumb-tip",we="index-finger-tip",An=["wrist","thumb-metacarpal","thumb-phalanx-proximal","thumb-phalanx-distal","thumb-tip","index-finger-metacarpal","index-finger-phalanx-proximal","index-finger-phalanx-intermediate","index-finger-phalanx-distal","index-finger-tip","middle-finger-metacarpal","middle-finger-phalanx-proximal","middle-finger-phalanx-intermediate","middle-finger-phalanx-distal","middle-finger-tip","ring-finger-metacarpal","ring-finger-phalanx-proximal","ring-finger-phalanx-intermediate","ring-finger-phalanx-distal","ring-finger-tip","pinky-finger-metacarpal","pinky-finger-phalanx-proximal","pinky-finger-phalanx-intermediate","pinky-finger-phalanx-distal","pinky-finger-tip"],Tn=["thumb-tip","index-finger-tip","middle-finger-tip","ring-finger-tip","pinky-finger-tip"],Rn=.02,En=.025;class Ie{constructor(e,t){this.hand=e,this.handedness=t,this.isPinching=!1,this.pinchStarted=!1,this.pinchEnded=!1,this.pinchPosition=new v,this._thumbPos=new v,this._indexPos=new v}update(){this.pinchStarted=!1,this.pinchEnded=!1;const e=this.hand.joints[Ee],t=this.hand.joints[we];if(!e||!t)return;e.getWorldPosition(this._thumbPos),t.getWorldPosition(this._indexPos);const s=this._thumbPos.distanceTo(this._indexPos);this.pinchPosition.lerpVectors(this._thumbPos,this._indexPos,.5);const n=this.isPinching;s<Rn?this.isPinching=!0:s>En&&(this.isPinching=!1),this.isPinching&&!n&&(this.pinchStarted=!0),!this.isPinching&&n&&(this.pinchEnded=!0)}getPinchPosition(){return this.pinchPosition}getPinchOrientation(){const e=this.hand.joints.wrist;return e?e.quaternion.clone():new J}getJointData(){const e=[],t=new v;for(const s of An){const n=this.hand.joints[s];n?(n.getWorldPosition(t),e.push({x:t.x,y:t.y,z:t.z})):e.push(null)}return{joints:e,pinching:this.isPinching}}getEssentialJointData(){const e=[],t=new v;for(const s of Tn){const n=this.hand.joints[s];n?(n.getWorldPosition(t),e.push({x:t.x,y:t.y,z:t.z})):e.push(null)}return{joints:e,pinching:this.isPinching}}hasValidData(){return this.hand.joints&&this.hand.joints[Ee]&&this.hand.joints[we]}}class wn{constructor(){this.localHandData=null,this.localHeadData=null,this.handUpdateInterval=null,this.headUpdateInterval=null,this.lastSentHandData=null,this.movementThreshold=.002,this.forceUpdateCounter=0,this.forceUpdateInterval=10,this.lastCameraUpdate=0,this.cameraUpdateInterval=50}initialize(){R.on("disconnected",()=>this.onDisconnected()),this.handUpdateInterval=setInterval(()=>this.sendHandTracking(),33),this.headUpdateInterval=setInterval(()=>this.sendHeadTracking(),33)}onDisconnected(){console.log("VR Client disconnected from host"),this.cleanup()}setHandData(e){this.localHandData=e}setHeadData(e){this.localHeadData=e}_hasHandMoved(e,t){var r,o,a,c;if(!t||!e)return!0;const s=(h,l)=>{if(!h||!l||!h.joints||!l.joints)return!0;const u=h.joints[0],p=l.joints[0];if(!u||!p)return!0;const m=Math.abs(u.x-p.x),b=Math.abs(u.y-p.y),f=Math.abs(u.z-p.z);return m>this.movementThreshold||b>this.movementThreshold||f>this.movementThreshold},n=s(e.left,t.left)||((r=e.left)==null?void 0:r.pinching)!==((o=t.left)==null?void 0:o.pinching),i=s(e.right,t.right)||((a=e.right)==null?void 0:a.pinching)!==((c=t.right)==null?void 0:c.pinching);return n||i}sendHandTracking(){if(!this.localHandData)return;this.forceUpdateCounter++;const e=this.forceUpdateCounter>=this.forceUpdateInterval;e&&(this.forceUpdateCounter=0),(e||this._hasHandMoved(this.localHandData,this.lastSentHandData))&&(R.sendToHost({type:I.VR_HAND_TRACKING,hands:this.localHandData,timestamp:Date.now()}),this.lastSentHandData=JSON.parse(JSON.stringify(this.localHandData)))}sendHeadTracking(){this.localHeadData&&R.sendToHost({type:I.VR_HEAD_TRACKING,head:this.localHeadData,timestamp:Date.now()})}sendCameraUpdate(e){const t=Date.now();t-this.lastCameraUpdate<this.cameraUpdateInterval||(this.lastCameraUpdate=t,R.sendToHost({type:I.CAMERA_UPDATE,camera:e,timestamp:t}))}cleanup(){this.handUpdateInterval&&(clearInterval(this.handUpdateInterval),this.handUpdateInterval=null),this.headUpdateInterval&&(clearInterval(this.headUpdateInterval),this.headUpdateInterval=null)}}const F=new wn;function In(d){var t,s,n,i;if(!d||!Array.isArray(d))return null;const e={};return(s=(t=d[0])==null?void 0:t.hasValidData)!=null&&s.call(t)&&(e.left=d[0].getJointData()),(i=(n=d[1])==null?void 0:n.hasValidData)!=null&&i.call(n)&&(e.right=d[1].getJointData()),Object.keys(e).length>0?e:null}function _n(d){return d?{position:{x:d.position.x,y:d.position.y,z:d.position.z},rotation:{x:d.rotation.x,y:d.rotation.y,z:d.rotation.z}}:null}class vn{constructor(){this.reset()}reset(){this.mode=null,this.isInGame=!1,this.renderer=null,this.camera=null,this.scene=null,this.clock=null,this.handTrackers=[],this.lobbyUI=null,this.gameHUD=null}setMode(e){this.mode=e,this.isInGame=e!==null}dispose(){this.renderer&&this.renderer.dispose(),this.reset()}}const T=new vn,Mn=.08;class Ln{constructor(e){this.scene=e,this.isHeld=!1,this.holdingHand=null,this._grabOffsetQuat=new J,this._tempQuat=new J,this.mesh=this._createMesh(),this.mesh.position.set(0,1,-.5),e.add(this.mesh)}_createMesh(){const e=new $,t=new Le(.06,.04,.03),s=new G({color:3355443}),n=new z(t,s);e.add(n);const i=new Rt(.015,.018,.02,16),r=new G({color:1118481,metalness:.8,roughness:.2}),o=new z(i,r);o.rotation.x=Math.PI/2,o.position.z=-.025,e.add(o);const a=new Et(.012,16),c=new G({color:4482730,metalness:.9,roughness:.1}),h=new z(a,c);h.position.z=-.036,e.add(h);const l=new Me(.004,8,8),u=new B({color:16711680});return this.indicator=new z(l,u),this.indicator.position.set(.025,.015,0),e.add(this.indicator),e}isWithinGrabRange(e){return this.mesh.position.distanceTo(e)<Mn}grab(e,t){this.isHeld=!0,this.holdingHand=e,t&&(this._tempQuat.copy(t).invert(),this._grabOffsetQuat.copy(this._tempQuat).multiply(this.mesh.quaternion))}release(){this.isHeld=!1,this.holdingHand=null}updatePosition(e,t){this.isHeld&&(this.mesh.position.copy(e),t&&this.mesh.quaternion.copy(t).multiply(this._grabOffsetQuat))}getTransform(){return{position:{x:this.mesh.position.x,y:this.mesh.position.y,z:this.mesh.position.z},rotation:{x:this.mesh.quaternion.x,y:this.mesh.quaternion.y,z:this.mesh.quaternion.z,w:this.mesh.quaternion.w}}}setTransform(e){e.position&&this.mesh.position.set(e.position.x,e.position.y,e.position.z),e.rotation&&this.mesh.quaternion.set(e.rotation.x,e.rotation.y,e.rotation.z,e.rotation.w)}dispose(){this.scene.remove(this.mesh),this.mesh.traverse(e=>{e.geometry&&e.geometry.dispose(),e.material&&e.material.dispose()})}}class Sn{constructor(e){this.lobbyUI=e,this.handSegmentRenderer=null,this.grabbableCamera=null}async start(){this.lobbyUI.hide(),T.setMode("vr-client"),T.renderer=wt(!0),T.camera=It();const e=_t();T.scene=e.scene,T.clock=new vt;const{hands:t}=yn(T.renderer,T.scene,!1);T.handTrackers=[new Ie(t[0],"left"),new Ie(t[1],"right")],this.handSegmentRenderer=new Mt(T.scene),this.grabbableCamera=new Ln(T.scene),F.sendCameraUpdate(this.grabbableCamera.getTransform()),F.initialize(),T.gameHUD=this.lobbyUI.createGameHUD("VR Client",!0),this._setupVRButton(),this._setupResizeHandler(),T.renderer.setAnimationLoop(()=>this.update())}_setupVRButton(){const e=document.createElement("button");e.textContent="Enter VR",e.style.cssText="position:fixed;bottom:20px;left:50%;transform:translateX(-50%);padding:15px 30px;font-size:18px;z-index:1000;",document.body.appendChild(e),e.onclick=async()=>{try{const t=await navigator.xr.requestSession("immersive-vr",{requiredFeatures:["hand-tracking"],optionalFeatures:["local-floor","bounded-floor"]});T.renderer.xr.setSession(t),e.style.display="none"}catch(t){console.error("Failed to start VR:",t);try{const s=await navigator.xr.requestSession("immersive-vr",{optionalFeatures:["local-floor","hand-tracking"]});T.renderer.xr.setSession(s),e.style.display="none"}catch(s){alert("Could not start VR: "+s.message)}}}}_setupResizeHandler(){window.addEventListener("resize",()=>{!T.camera||!T.renderer||(T.camera.aspect=window.innerWidth/window.innerHeight,T.camera.updateProjectionMatrix(),T.renderer.setSize(window.innerWidth,window.innerHeight))})}_updateCameraGrab(){if(this.grabbableCamera){for(const e of T.handTrackers)if(e.hasValidData()){if(e.pinchStarted&&!this.grabbableCamera.isHeld){const t=e.getPinchPosition();if(this.grabbableCamera.isWithinGrabRange(t)){const s=e.getPinchOrientation();this.grabbableCamera.grab(e.handedness,s)}}if(this.grabbableCamera.isHeld&&this.grabbableCamera.holdingHand===e.handedness&&e.isPinching){const t=e.getPinchPosition(),s=e.getPinchOrientation();this.grabbableCamera.updatePosition(t,s),F.sendCameraUpdate(this.grabbableCamera.getTransform())}e.pinchEnded&&this.grabbableCamera.holdingHand===e.handedness&&(this.grabbableCamera.release(),F.sendCameraUpdate(this.grabbableCamera.getTransform()))}}}update(){T.handTrackers.forEach(n=>n.update()),this._updateCameraGrab();const e=In(T.handTrackers);e&&(F.setHandData(e),this.handSegmentRenderer.updateHands(e));const t=T.renderer.xr.getCamera(),s=_n(t);s&&F.setHeadData(s),T.renderer.render(T.scene,T.camera)}}let w,_e,ve;function Cn(){w=new Lt,w.onHostDashboard=async()=>{try{w.setStatus("Starting dashboard host..."),Nn()}catch(d){console.error("Failed to start dashboard:",d),w.setStatus("Failed to start: "+(d.message||"Unknown error"))}},w.onJoinAsVR=async()=>{const d=w.getRoomCodeInput();if(!d){w.setStatus("Please enter a room code");return}try{w.setStatus(`Connecting to room ${d}...`),await R.joinAsVRClient(d),w.setStatus("Connected! Starting VR..."),Hn()}catch(e){console.error("Failed to join as VR:",e),w.setStatus("Failed to join: "+(e.message||"Unknown error"))}}}async function Nn(){try{_e=new Nt(w),await _e.start()}catch(d){console.error("Failed to start dashboard host:",d),w.show(),w.setStatus("Failed to start: "+(d.message||"Unknown error"))}}async function Hn(){try{ve=new Sn(w),await ve.start()}catch(d){console.error("Failed to start VR client:",d),w.show(),w.setStatus("Failed to start VR: "+(d.message||"Unknown error"))}}Cn();
