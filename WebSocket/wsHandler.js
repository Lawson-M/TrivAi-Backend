import gameState from '../Services/gameState.js';
import WebSocket from 'ws';

let wss;
const HEARTBEAT_INTERVAL = 30000; // 30 seconds
const HEARTBEAT_TIMEOUT = 10000; // 10 seconds
let heartbeatInterval = {};

const setWebSocketServer = (webSocketServer) => {
  wss = webSocketServer;

  heartbeatInterval = setInterval(() => {
    wss.clients.forEach(client => {

      client.isAlive = false; // Reset isAlive status
      client.send(JSON.stringify({ type: 'heartbeat' }));
      
      if (client.heartbeatTimeout) {
        clearTimeout(client.heartbeatTimeout);
      }
      
      client.heartbeatTimeout = setTimeout(() => {
        if (!client.isAlive) {
          console.log('[WebSocket] Client did not respond in time');
          client.terminate();
        }
      }, HEARTBEAT_TIMEOUT);
    });
  }, HEARTBEAT_INTERVAL);

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

        case 'heartbeat': {
          ws.isAlive = true;
          console.log('[WebSocket] Client is awake');
          break;
        }

        case 'joinLobby': {
          const lobby = gameState.getLobbyState(data.lobbyId);
          if (lobby) {
            ws.lobbyId = data.lobbyId;
            ws.username = data.username;
            gameState.addPlayerToLobby(data.lobbyId, data.username, data.isGuest);
            broadcast({type: 'playersUpdate', players: lobby.players}, data.lobbyId);
          } else {
            ws.send(JSON.stringify({ type: 'error', message: 'Lobby not found' }));
          }
          break;
        }
        
        case 'updateScore': {
          const lobbyId = data.lobbyId;
          gameState.addCorrectPlayer(lobbyId, data.username);
          const lobbyState = gameState.getLobbyState(lobbyId);
          if (lobbyState) {
            const player = lobbyState.players.find(p => p.name === data.username);
            if (player) {
              player.score = player.score + lobbyState.timeLeft;;
              broadcast({ 
                type: 'playersUpdate', 
                players: lobbyState.players,
                correctPlayers: lobbyState.correctPlayers
              }, lobbyId);
            }
          }
          break;
        }

        case 'leaveLobby': {
          const { lobbyId, username, host } = data;
          const lobby = gameState.getLobbyState(lobbyId);
          
          if (lobby) {

            if (host) {
              gameState.deleteLobby(lobbyId);
              broadcast({ type: 'lobbyDeleted' }, lobbyId);
              break;
            }

            // Remove player from lobby
            gameState.removePlayerFromLobby(lobbyId, username);
            const updatedLobby = gameState.getLobbyState(lobbyId);
            
            // Notify remaining players
            broadcast({
              type: 'playersUpdate',
              players: updatedLobby.players,
              correctPlayers: updatedLobby.correctPlayers || []
            }, lobbyId);
            
            // If lobby is empty, reset it
            if (updatedLobby.players.length === 0) {
              gameState.deleteLobby(lobbyId);
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