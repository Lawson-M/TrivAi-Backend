import gameState from '../Services/gameState.js';

let wss;
const setWebSocketServer = (webSocketServer) => {
  wss = webSocketServer;
};

const broadcast = (data, lobbyId) => {
  const lobby = gameState.getLobbyState(lobbyId);
  if (lobby) {
    lobby.players.forEach(client => {
      if (client.readyState === WebSocket.OPEN) {
        client.send(JSON.stringify(data));
      }
    });
  }
};

const handleWebSocketConnection = (ws) => {
  console.log('New WebSocket connection established');

  ws.on('message', (message) => {
    const data = JSON.parse(message);
    if (data.type === 'createLobby') {
      const lobbyId = gameState.createLobby();
      ws.send(JSON.stringify({ type: 'lobbyCreated', lobbyId }));
    } else if (data.type === 'joinLobby') {
      const lobby = gameState.getLobbyState(data.lobbyId);
      if (lobby) {
        gameState.addPlayerToLobby(data.lobbyId, data.username);
        ws.send(JSON.stringify({ type: 'joinedLobby', lobbyId: data.lobbyId }));
      } else {
        ws.send(JSON.stringify({ type: 'error', message: 'Lobby not found' }));
      }
    } else if (data.type === 'updateScore') {
      const lobbyId = data.lobbyId;
      const lobbyState = gameState.getLobbyState(lobbyId);
      if (lobbyState) {
        const player = lobbyState.players.find(p => p.name === data.username);
        if (player) {
          player.score += data.score;
          broadcast({ type: 'playersUpdate', players: lobbyState.players }, lobbyId);
        }
      }
    }
  });

  ws.on('close', () => {
    console.log('WebSocket connection closed');
  });

  ws.on('error', (error) => {
    console.error('WebSocket error:', error);
  });
};

export { handleWebSocketConnection, broadcast, setWebSocketServer };