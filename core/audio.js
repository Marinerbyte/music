const { spawn } = require('child_process');
const wrtc = require('wrtc');

class AudioEngine {
  constructor() {
    this.source = new wrtc.nonstandard.RTCAudioSource();
    this.track = this.source.createTrack();
    this.ffmpeg = null;
  }

  async play(query) {
    this.stop();
    const search = query.startsWith('http') ? query : `scsearch1:${query}`;
    const ytdlp = spawn('/usr/local/bin/yt-dlp', [search, '--get-url', '--format', 'bestaudio']);

    let url = '';
    ytdlp.stdout.on('data', (d) => url += d.toString());

    ytdlp.on('close', () => {
      url = url.trim();
      if (!url) return;
      this.ffmpeg = spawn('ffmpeg', [
        '-re', '-i', url, '-f', 's16le', '-ar', '48000', '-ac', '1', '-loglevel', 'quiet', 'pipe:1'
      ]);
      this.ffmpeg.stdout.on('data', (buffer) => {
        const samples = new Int16Array(buffer.buffer, buffer.byteOffset, buffer.byteLength / 2);
        this.source.onData({ samples, sampleRate: 48000, bitsPerSample: 16, channelCount: 1 });
      });
    });
  }

  stop() { if (this.ffmpeg) this.ffmpeg.kill(); }
}

module.exports = new AudioEngine();
