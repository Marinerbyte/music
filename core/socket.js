const WebSocket = require('ws');
const EventEmitter = require('events');
const { v4: uuidv4 } = require('uuid');

class WSManager extends EventEmitter {
  constructor(config) {
    super();
    this.config = config;
    this.ws = null;
    this.token = null;
  }

  async login() {
    const res = await fetch(this.config.apiUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username: this.config.username, password: this.config.password })
    });
    const data = await res.json();
    this.token = data.token;
  }

  connect() {
    this.ws = new WebSocket(`${this.config.wsUrl}?token=${this.token}`);
    this.ws.on('open', () => {
      this.send({ handler: 'login', username: this.config.username, password: this.config.password });
      setTimeout(() => this.joinRoom(this.config.defaultRoom), 1500);
    });

    this.ws.on('message', (msg) => {
      const data = JSON.parse(msg);
      if (data.handler === 'joinchatroom' && data.roomid) {
        setTimeout(() => this.send({ handler: 'audioroom', action: 'join', roomId: data.roomid }), 1000);
      }
      if (data.handler === 'audioroom' && data.type === 'transport-created') this.emit('audio_ready', data);
      if (data.type === 'producer-created') this.emit('mic_live', data.producerId);
      this.emit('data', data);
    });
  }

  send(payload) { this.ws.send(JSON.stringify(payload)); }

  joinRoom(name) {
    this.send({ handler: 'joinchatroom', id: uuidv4(), name: name, roomPassword: "" });
  }
}

module.exports = WSManager;
