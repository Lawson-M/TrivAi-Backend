import express from 'express';
import cors from 'cors';
import { WebSocketServer } from 'ws';
import { handleWebSocketConnection, setWebSocketServer } from './WebSocket/wsHandler.js';
import aiRoutes from './Routes/gameRoutes.js';

const app = express();
app.use(express.json());
app.use(cors());

app.use('/game', aiRoutes);
 
const PORT = process.env.PORT || 5000;
const server = app.listen(PORT, () => console.log(`Server running on port ${PORT}`));

const wss = new WebSocketServer({ server });
setWebSocketServer(wss);
wss.on('connection', handleWebSocketConnection);