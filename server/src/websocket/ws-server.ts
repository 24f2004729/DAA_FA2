import { WebSocket, WebSocketServer } from 'ws';
import { Server } from 'http';
import { WsMessage, RunAlgorithmRequest } from '@bank-opt/shared';

export const initWsServer = (server: Server) => {
  const wss = new WebSocketServer({ server });

  wss.on('connection', (ws: WebSocket) => {
    console.log('Client connected to WebSocket');
    
    let isPaused = false;
    let isStopped = false;

    ws.on('message', (data) => {
      try {
        const message = JSON.parse(data.toString());
        
        switch (message.type) {
          case 'RUN':
            // Stub for RUN - in reality you'd stream events here
            const req = message.payload as RunAlgorithmRequest;
            ws.send(JSON.stringify({ type: 'RUN_START', payload: { id: req.algorithmId } } as WsMessage));
            break;
          case 'PAUSE':
            isPaused = true;
            break;
          case 'RESUME':
            isPaused = false;
            break;
          case 'STOP':
            isStopped = true;
            break;
          default:
            console.warn('Unknown ws message type:', message.type);
        }
      } catch (err) {
        console.error('WS Error:', err);
      }
    });

    ws.on('close', () => {
      console.log('Client disconnected');
    });
  });
};
