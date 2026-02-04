const WebSocket = require('ws');
const EventEmitter = require('events');
const { v4: uuidv4 } = require('uuid');

class WSManager extends EventEmitter {
  constructor(config) {
    super();
    this.config = config;
    this.ws = null;
    this.token = null;
    this.currentRoomId = null;
  }

  async login() {
    try {
      const res = await fetch(this.config.apiUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username: this.config.username, password: this.config.password })
      });
      const data = await res.json();
      this.token = data.token;
      console.log("[SIGNaling] Login Successful.");
    } catch (e) { console.error("Login Error:", e); }
  }

  connect() {
    this.ws = new WebSocket(`${this.config.wsUrl}?token=${this.token}`);

    this.ws.on('open', () => {
      console.log("[WS] Connected to Howdies Server.");
      this.send({ handler: 'login', username: this.config.username, password: this.config.password });
      
      // 1.5s delay taaki server load na le
      setTimeout(() => this.joinRoom(this.config.defaultRoom), 1500);
    });

    this.ws.on('message', (msg) => {
      const data = JSON.parse(msg);

      // Auto-fetch Room ID
      if (data.handler === 'joinchatroom' && data.roomid) {
        this.currentRoomId = data.roomid;
        console.log(`[JOIN] Room ID is ${this.currentRoomId}. Requesting Audio Join...`);
        
        // 1s delay audio join se pehle
        setTimeout(() => {
          this.send({ handler: 'audioroom', action: 'join', roomId: this.currentRoomId });
        }, 1000);
      }

      if (data.handler === 'audioroom') {
        if (data.type === 'transport-created') this.emit('audio_ready', data);
        if (data.type === 'producer-created') this.emit('mic_live', data.producerId);
      }

      this.emit('data', data);
    });

    this.ws.on('close', () => {
      console.log("Reconnecting in 5s...");
      setTimeout(() => this.connect(), 5000);
    });
  }

  send(payload) {
    if (this.ws && this.ws.readyState === WebSocket.OPEN) {
      this.ws.send(JSON.stringify(payload));
    }
  }

  joinRoom(name) {
    console.log(`[ACTION] Joining Chatroom: ${name}`);
    this.send({ handler: 'joinchatroom', id: uuidv4(), name: name, roomPassword: "" });
  }
}

module.exports = WSManager;
