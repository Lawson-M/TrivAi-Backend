import { config } from './config.js';
import express from 'express';
import cors from 'cors';
import { WebSocketServer } from 'ws';
import { handleWebSocketConnection, setWebSocketServer } from './WebSocket/wsHandler.js';
import aiRoutes from './Routes/gameRoutes.js';
import { connectDB } from './Database/db.js';
import authRoutes from './Routes/authRoutes.js';

const app = express();
app.use(express.json());
app.use(cors());

connectDB().catch(console.dir);

app.use('/api/auth', authRoutes);
app.use('/api/game', aiRoutes);
 
const PORT = config.PORT;
const server = app.listen(PORT, () => console.log(`Server running on port ${PORT}`));

const wss = new WebSocketServer({ server });
setWebSocketServer(wss);
wss.on('connection', handleWebSocketConnection);