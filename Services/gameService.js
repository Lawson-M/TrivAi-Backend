import gameState from '../Services/gameState.js';
import { getOpenAIResponse } from '../Services/aiService.js';
import { broadcast } from '../WebSocket/wsHandler.js';
import { addSeenQuestions } from '../Controllers/userController.js';
import { getSeenQuestionsByUsers } from '../Controllers/questionController.js';

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

    const seenQuestions =  await getSeenQuestionsByUsers(gameState.getPlayers(lobbyId), prompt);
    const {newQuestionSet, questionIds} = await getOpenAIResponse(prompt, seenQuestions);

    if (!questionIds || !newQuestionSet) {
      throw new Error('Failed to generate questions');
    }

    await addQuestionToPlayers(lobbyId, questionIds);
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

const addQuestionToPlayers = async (lobbyId, questoinIds) => {
  const players = gameState.getPlayers(lobbyId);
  players.forEach(player => {
      addSeenQuestions(player.name, questoinIds).then(() => {
      console.log(`Questions added to player ${player.name}`);
    }).catch(err => {
      console.error(`Error adding questions to player ${player.name}:`, err);
    });
  });
}

export { startGame, initializeGame, stopGame };