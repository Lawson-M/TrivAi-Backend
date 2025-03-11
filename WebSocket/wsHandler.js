import gameState from '../Services/gameState.js';
import WebSocket from 'ws';

let wss;
const setWebSocketServer = (webSocketServer) => {
  wss = webSocketServer;
};

const broadcast = (data, lobbyId) => {
  console.log(`[Broadcast] Attempting to broadcast to lobby ${lobbyId}:`, data);
  if (!wss) {
    console.error('[Broadcast] WebSocket server not initialized');
    return;
  }

  wss.clients.forEach(client => {
    if (client.readyState === WebSocket.OPEN && client.lobbyId === lobbyId) {
      try {
        client.send(JSON.stringify(data));
        console.log(`[Broadcast] Sent to client in lobby ${lobbyId}`);
      } catch (error) {
        console.error('[Broadcast] Error sending to client:', error);
      }
    }
  });
};

const handleWebSocketConnection = (ws) => {
  console.log('[WebSocket] New connection established');

  ws.on('message', (message) => {
    try {
      const data = JSON.parse(message);
      console.log('[WebSocket] Received message:', data);

      switch (data.type) {
        case 'joinLobby': {
          const lobby = gameState.getLobbyState(data.lobbyId);
          if (lobby) {
            ws.lobbyId = data.lobbyId;
            ws.username = data.username;
            gameState.addPlayerToLobby(data.lobbyId, data.username);
            ws.send(JSON.stringify({ type: 'joinedLobby', lobbyId: data.lobbyId }));
            broadcast({type: 'playersUpdate', players: lobby.players}, data.lobbyId);
          } else {
            ws.send(JSON.stringify({ type: 'error', message: 'Lobby not found' }));
          }
          break;
        }
        
        case 'updateScore': {
          const lobbyId = data.lobbyId;
          const lobbyState = gameState.getLobbyState(lobbyId);
          if (lobbyState) {
            const player = lobbyState.players.find(p => p.name === data.username);
            if (player) {
              player.score += data.score;
              broadcast({ 
                type: 'playersUpdate', 
                players: lobbyState.players 
              }, lobbyId);
            }
          }
          break;
        }

        default:
          console.log(`[WebSocket] Unhandled message type: ${data.type}`);
          break;
      }
    } catch (error) {
      console.error('[WebSocket] Error processing message:', error);
    }
  });
};

export { handleWebSocketConnection, broadcast, setWebSocketServer };