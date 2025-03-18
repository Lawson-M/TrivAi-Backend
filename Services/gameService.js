import gameState from '../Services/gameState.js';
import { getOpenAIResponse } from '../Services/aiService.js';
import { broadcast } from '../WebSocket/wsHandler.js';
import { sleep } from 'openai/core.mjs';

let gameIntervals = {};

const handleTimeUp = (lobbyId) => {
  clearInterval(gameIntervals[lobbyId]);

  // Display answer
  broadcast({
    type: 'displayAnswer'
  }, lobbyId);

  // Wait 5 seconds then move to next question
  setTimeout(() => {
    gameState.clearCorrectPlayers(lobbyId);
    const nextIndex = gameState.getCurrentQuestionIndex(lobbyId) + 1;
    if (nextIndex < gameState.getQuestionSet(lobbyId).length) {
      gameState.setCurrentQuestionIndex(lobbyId, nextIndex);
      gameState.setTimeLeft(lobbyId, 20);
      broadcast({
        type: 'nextQuestion',
        question: gameState.getQuestionSet(lobbyId)[nextIndex]
      }, lobbyId);
      
      // Restart game interval with new question
      startGame(lobbyId);
    } else {
      stopGame(lobbyId);
    }
  }, 5000);
};

const startGame = (lobbyId) => {

  gameIntervals[lobbyId] = setInterval(() => {

    if (gameState.getTimeLeft(lobbyId) > 0) {
      gameState.setTimeLeft(lobbyId, gameState.getTimeLeft(lobbyId) - 1);
      broadcast({
        type: 'gameState',
        timeLeft: gameState.getTimeLeft(lobbyId),
        players: gameState.getPlayers(lobbyId)
      }, lobbyId);
    } else {
      handleTimeUp(lobbyId);
    }
  }, 1000);
};

const initializeGame = async (prompt, lobbyId) => {
  try {
    const newQuestionSet = await getOpenAIResponse(prompt);
    gameState.setQuestionSet(lobbyId, newQuestionSet);

    gameState.setCurrentQuestionIndex(lobbyId, 0);
    gameState.setTimeLeft(lobbyId, 20);
    gameState.clearCorrectPlayers(lobbyId);
  
    broadcast({ 
      type: 'gameStarted',
      question: gameState.getQuestionSet(lobbyId)[0],
      timeLeft: gameState.getTimeLeft(lobbyId),
      players: gameState.getPlayers(lobbyId)
    }, lobbyId);

    startGame(lobbyId);
  } catch (error) {
    console.error('Error initializing game:', error);
  }
};

const stopGame = (lobbyId) => {
  broadcast({type: 'gameOver'}, lobbyId);
  clearInterval(gameIntervals[lobbyId]);
  delete gameIntervals[lobbyId];
};

export { startGame, initializeGame, stopGame };