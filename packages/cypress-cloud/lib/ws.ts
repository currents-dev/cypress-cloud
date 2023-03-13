// plug for future websocket server
import http from "http";
import WebSocket from "ws";
import { bus } from "./bus";

let server: http.Server | null = null;
let wss: WebSocket.Server | null = null;

export const getWSSPort = () => server?.address()?.port;

export const startWSS = () => {
  if (wss) {
    return;
  }
  server = http
    .createServer()
    .on("listening", () => {
      wss = new WebSocket.Server({
        server,
      });
      console.log("starting wss on port %d", getWSSPort());
      wss.on("connection", function connection(ws) {
        ws.on("message", function incoming(event) {
          const message = JSON.parse(event.toString());
          bus.emit(message.type, message.payload);
        });
      });
    })
    .listen();
};
