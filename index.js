const WSManager = require('./core/socket');
const MediasoupHandler = require('./core/mediasoup');
const audio = require('./core/audio');

// ================= CONFIG (HARDCODED) =================
const config = {
  username: "kamina",
  password: "p99665",
  defaultRoom: "goodness",
  apiUrl: "https://api.howdies.app/api/login",
  wsUrl: "wss://app.howdies.app/howdies"
};
// ======================================================

const bot = new WSManager(config);
const ms = new MediasoupHandler(bot);

bot.on('audio_ready', (data) => {
  ms.init(data); // Mic auto-connect logic
});

bot.on('data', (data) => {
  if (data.handler === 'chatroommessage' && data.text?.startsWith('!')) {
    const parts = data.text.slice(1).split(' ');
    const cmd = parts[0].toLowerCase();
    const arg = parts.slice(1).join(' ');

    if (cmd === 'play') {
      audio.play(arg);
      bot.send({ handler: 'chatroommessage', roomid: data.roomid, type: 'text', text: `Searching & Playing: ${arg} 🎙️` });
    }

    if (cmd === 'js') {
      bot.joinRoom(arg); // Bas room name likho, ID ye khud nikalega
    }

    if (cmd === 'stop') {
      audio.stop();
      bot.send({ handler: 'chatroommessage', roomid: data.roomid, type: 'text', text: "⏹️ Stopped." });
    }
  }
});

console.log("Starting Bot for Kamina...");
bot.login().then(() => bot.connect());
