import express from 'express';
import cors from 'cors';
import { WebSocketServer } from 'ws';
import { getOpenAIResponse } from './Services/AiService.js';

const app = express();
app.use(express.json());
app.use(cors());

let players = [];
let currentQuestionIndex = 0;
let timeLeft = 20;
let questionSet = [];

const broadcast = (data) => {
  wss.clients.forEach(client => {
    if (client.readyState === WebSocket.OPEN) {
      client.send(JSON.stringify(data));
    }
  });
};

app.post('/openai', async (req, res) => {
  try {
    const { prompt } = req.body;
    if (!prompt) {
      return res.status(400).json({ error: 'Prompt is required' });
    }

    questionSet = await getOpenAIResponse(prompt);
    currentQuestionIndex = 0;
    broadcast({ type: 'gameStarted' });
    startGame();
    res.json({ success: true, message: 'Game started' });

  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.post('/save-username', async (req, res) => {
  const { username } = req.body;
  if (!username) {
    return res.status(400).json({ error: 'Username is required' });
  }

  players.push({ name: username, score: 0 });
  res.json({ success: true });
});

app.get('/players', (req, res) => {
  res.json({ players });
});

const PORT = process.env.PORT || 5000;
const server = app.listen(PORT, () => console.log(`Server running on port ${PORT}`));

const wss = new WebSocketServer({ server });

wss.on('connection', (ws) => {
  console.log('New WebSocket connection established');

  ws.on('message', (message) => {
    const data = JSON.parse(message);
    if (data.type === 'updateScore') {
      const player = players.find(p => p.name === data.username);
      if (player) {
        player.score += data.score;
        broadcast({ type: 'playersUpdate', players });
      }
    }
  });

  ws.send(JSON.stringify({
    type: 'gameState',
    currentQuestionIndex,
    question: questionSet[currentQuestionIndex],
    timeLeft,
    players
  }));

  ws.on('close', () => {
    console.log('WebSocket connection closed');
  });

  ws.on('error', (error) => {
    console.error('WebSocket error:', error);
  });
});


let gameInterval;

const startGame = () => {
  gameInterval = setInterval(() => {
    if (timeLeft > 0) {
      timeLeft -= 1;
    } else {
      currentQuestionIndex += 1;
      if (currentQuestionIndex < questionSet.length) {
        timeLeft = 20;
      } else {
        broadcast({ type: 'gameOver' });
        stopGame();
        return;
      }
    }
    broadcast({
      type: 'gameState',
      currentQuestionIndex,
      question: questionSet[currentQuestionIndex],
      timeLeft,
      players
    });
  }, 1000);
};

const stopGame = () => {
  clearInterval(gameInterval);
}