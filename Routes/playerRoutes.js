import express from 'express';
import gameState from '../Services/gameState.js';

const router = express.Router();

router.post('/save-username', async (req, res) => {
  const { username, lobbyId } = req.body;
  if (!username || !lobbyId) {
    return res.status(400).json({ error: 'Username and LobbyId are required' });
  }

  gameState.addPlayerToLobby(lobbyId, username);
  res.json({ success: true });
});

router.get('/getplayers', (req, res) => {
  const { lobbyId } = req.query;

  if (!lobbyId) {
    return res.status(400).json({ error: 'lobbyId is required' });
  }

  const players = gameState.getPlayers(lobbyId);
  res.json({ players });
});

export default router;