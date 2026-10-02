import { WsMessage } from '@bank-opt/shared';

export class WebSocketClient {
  private ws: WebSocket | null = null;
  private onEventCb: ((event: any) => void) | null = null;
  private onCompleteCb: ((result: any) => void) | null = null;
  private onErrorCb: ((err: any) => void) | null = null;

  connect() {
    this.ws = new WebSocket('ws://localhost:3001/ws');
    
    this.ws.onmessage = (event) => {
      try {
        const msg: WsMessage = JSON.parse(event.data);
        if (msg.type === 'EVENT' && this.onEventCb) {
          this.onEventCb(msg.payload);
        } else if (msg.type === 'COMPLETE' && this.onCompleteCb) {
          this.onCompleteCb(msg.payload);
        } else if (msg.type === 'ERROR' && this.onErrorCb) {
          this.onErrorCb(msg.payload);
        }
      } catch (e) {
        console.error('Error parsing WS message', e);
      }
    };
  }

  onEvent(cb: (event: any) => void) { this.onEventCb = cb; }
  onComplete(cb: (result: any) => void) { this.onCompleteCb = cb; }
  onError(cb: (err: any) => void) { this.onErrorCb = cb; }
  
  disconnect() {
    if (this.ws) {
      this.ws.close();
      this.ws = null;
    }
  }
}
