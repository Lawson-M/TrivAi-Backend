import gameState from '../Services/gameState.js';
import { getOpenAIResponse } from '../Services/aiService.js';
import { broadcast } from '../WebSocket/wsHandler.js';

let gameIntervals = {};

const startGame = (lobbyId) => {
  gameIntervals[lobbyId] = setInterval(() => {
    if (gameState.getTimeLeft(lobbyId) > 0) {
      gameState.setTimeLeft(lobbyId, gameState.getTimeLeft(lobbyId) - 1);
    } else {
      gameState.setCurrentQuestionIndex(lobbyId, gameState.getCurrentQuestionIndex(lobbyId) + 1);
      if (gameState.getCurrentQuestionIndex(lobbyId) < gameState.getQuestionSet(lobbyId).length) {
        gameState.setTimeLeft(lobbyId, 20);
      } else {
        stopGame(lobbyId);
        return;
      }
    }
    broadcast({
      type: 'gameState',
      currentQuestionIndex: gameState.getCurrentQuestionIndex(lobbyId),
      question: gameState.getQuestionSet(lobbyId)[gameState.getCurrentQuestionIndex(lobbyId)],
      timeLeft: gameState.getTimeLeft(lobbyId),
      players: gameState.getPlayers(lobbyId)
    }, lobbyId);
  }, 1000);
};

const initializeGame = async (prompt, lobbyId) => {
  try {
    const newQuestionSet = await getOpenAIResponse(prompt);
    gameState.setQuestionSet(lobbyId, newQuestionSet);
    gameState.setCurrentQuestionIndex(lobbyId, 0);
    broadcast({ type: 'gameStarted' }, lobbyId);
    startGame(lobbyId);
  } catch (error) {
    console.error('Error initializing game:', error);
  }
};

const stopGame = (lobbyId) => {
  broadcast({ type: 'gameOver' }, lobbyId);
  clearInterval(gameIntervals[lobbyId]);
  delete gameIntervals[lobbyId];
};

export { startGame, initializeGame, stopGame };