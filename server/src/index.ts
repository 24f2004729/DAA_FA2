import express from 'express';
import cors from 'cors';
import http from 'http';
import { errorHandler } from './middleware/error-handler';
import scenariosRouter from './routes/scenarios';
import algorithmsRouter from './routes/algorithms';
import complexityRouter from './routes/complexity';
import correctnessRouter from './routes/correctness';
import { initWsServer } from './websocket/ws-server';

const app = express();
const port = process.env.PORT || 3001;

// Middleware
app.use(cors({ origin: 'http://localhost:5173' }));
app.use(express.json());

// Routes
app.use('/api/scenarios', scenariosRouter);
app.use('/api/algorithms', algorithmsRouter);
app.use('/api/complexity', complexityRouter);
app.use('/api/correctness', correctnessRouter);

// Error Handling
app.use(errorHandler);

const server = http.createServer(app);

// Initialize WebSocket server
initWsServer(server);

server.listen(port, () => {
  console.log(`Server running at http://localhost:${port}`);
});
