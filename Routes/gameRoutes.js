import express from 'express';
import { initializeGame } from '../Services/gameService.js';
import gameState from '../Services/gameState.js';

const router = express.Router();

router.post('/openai', async (req, res) => {
  try {
    const { prompt, lobbyId } = req.body;
    if (!prompt || !lobbyId) {
      return res.status(400).json({ error: 'Prompt and LobbyId are required' });
    }

    await initializeGame(prompt, lobbyId);
    res.json({ success: true, message: 'Game started' });

  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.post('/create-lobby', async (req, res) => {
  try {
    const newLobbyId = gameState.createLobby();
    res.json({ success: true, lobbyId: newLobbyId });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.get('/check-lobby/:lobbyId', (req, res) => {
  try {
    const { lobbyId } = req.params;
    const lobbyExists = gameState.getLobbyState(lobbyId) !== undefined;
    res.json({ exists: lobbyExists });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

export default router;