class GameState {
    constructor() {
      this.lobbies = {};
    }
  
    createLobby() {
      const newLobbyId = Math.random().toString(36).substring(7);
      this.lobbies[newLobbyId] = {
        players: [],
        currentQuestionIndex: 0,
        timeLeft: 20,
        questionSet: [],
        correctPlayers: []
      };
      return newLobbyId;
    }

    deleteLobby(lobbyId) {
      if (this.lobbies[lobbyId]) {
        delete this.lobbies[lobbyId];
        return true;
      }
      return false;
    }

    addCorrectPlayer(lobbyId, player) {
      this.lobbies[lobbyId].correctPlayers.push(player);
    }

    clearCorrectPlayers(lobbyId) {
      this.lobbies[lobbyId].correctPlayers = [];
    }
  
    addPlayerToLobby(lobbyId, username, isGuest) {
      if (this.lobbies[lobbyId]) {
        this.lobbies[lobbyId].players.push({ name: username, score: 0, isGuest: isGuest });
      }
    }
  
    removePlayerFromLobby(lobbyId, username) {
      if (this.lobbies[lobbyId]) {
        this.lobbies[lobbyId].players = this.lobbies[lobbyId].players.filter(p => p.name !== username);
      }
    }
  
    getLobbyState(lobbyId) {
      return this.lobbies[lobbyId];
    }
  
    getPlayers(lobbyId) {
      return this.lobbies[lobbyId].players;
    }
  
    resetGame(lobbyId) {
      this.lobbies[lobbyId].players = [];
      this.lobbies[lobbyId].currentQuestionIndex = 0;
      this.lobbies[lobbyId].timeLeft = 20;
      this.lobbies[lobbyId].questionSet = [];
    }
  
    getCurrentQuestionIndex(lobbyId) {
      return this.lobbies[lobbyId].currentQuestionIndex;
    }
  
    setCurrentQuestionIndex(lobbyId, index) {
      this.lobbies[lobbyId].currentQuestionIndex = index;
    }
  
    getTimeLeft(lobbyId) {
      return this.lobbies[lobbyId].timeLeft;
    }
  
    setTimeLeft(lobbyId, time) {
      this.lobbies[lobbyId].timeLeft = time;
    }
  
    getQuestionSet(lobbyId) {
      return this.lobbies[lobbyId].questionSet;
    }
  
    setQuestionSet(lobbyId, newQuestionSet) {
      this.lobbies[lobbyId].questionSet = newQuestionSet;
    }
  }
  
  export default new GameState();