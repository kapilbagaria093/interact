import { WebSocketServer, WebSocket } from "ws";
import { Server } from "http";

let wss: WebSocketServer | null = null;

export function initWebSocketServer(server: Server) {
  wss = new WebSocketServer({ server });

  wss.on("connection", (ws: WebSocket) => {
    console.log("New WebSocket client connected");

    const state = { isAlive: true };
    
    // Heartbeat ping/pong to terminate dead sockets and prevent memory leaks
    const pingInterval = setInterval(() => {
      if (!state.isAlive) {
        clearInterval(pingInterval);
        return ws.terminate();
      }
      state.isAlive = false;
      try {
        ws.ping();
      } catch (err) {
        console.error("Failed to ping WebSocket:", err);
        clearInterval(pingInterval);
        ws.terminate();
      }
    }, 30000);

    ws.on("pong", () => {
      state.isAlive = true;
    });

    ws.on("close", () => {
      console.log("WebSocket client disconnected");
      clearInterval(pingInterval);
    });

    ws.on("error", (err) => {
      console.error("WebSocket client error:", err);
      clearInterval(pingInterval);
      ws.terminate();
    });
  });

  console.log("WebSocket server attached successfully.");
}

export function broadcast(type: string, payload: any) {
  if (!wss) return;
  const message = JSON.stringify({ type, payload });
  wss.clients.forEach((client) => {
    if (client.readyState === WebSocket.OPEN) {
      try {
        client.send(message);
      } catch (err) {
        console.error("Failed to send WebSocket message:", err);
      }
    }
  });
}
