const mediasoup = require('mediasoup-client');

class MediasoupHandler {
  constructor(ws) {
    this.ws = ws;
    this.device = null;
  }

  async init(data) {
    try {
      if (!this.device) {
        this.device = new mediasoup.Device({ handlerName: 'Chrome74' });
        await this.device.load({ routerRtpCapabilities: data.routerRtpCapabilities });
      }
      const transport = this.device.createSendTransport(data.transports.send);
      transport.on('connect', ({ dtlsParameters }, callback) => {
        this.ws.send({ handler: 'audioroom', action: 'connect-transport', roomId: data.roomId, direction: 'send', dtlsParameters });
        callback();
      });
      transport.on('produce', ({ kind, rtpParameters }, callback) => {
        this.ws.send({ handler: 'audioroom', action: 'produce', roomId: data.roomId, kind, rtpParameters, requestId: "mic-" + Date.now() });
        this.ws.once('mic_live', (id) => callback({ id }));
      });
      const audio = require('./audio');
      await transport.produce({ track: audio.track });
    } catch (e) { console.error(e); }
  }
}

module.exports = MediasoupHandler;
