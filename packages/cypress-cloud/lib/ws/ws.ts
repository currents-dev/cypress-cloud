import http from "http";
import { match, P } from "ts-pattern";
import WebSocket from "ws";
import { pubsub } from "../pubsub";

let server: http.Server | null = null;
let wss: WebSocket.Server | null = null;

export const getWSSPort = () =>
  match(server?.address())
    .with({ port: P.number }, (address) => address.port)
    .run();

export const startWSS = () => {
  if (wss) {
    return;
  }
  server = http
    .createServer()
    .on("listening", () => {
      if (!server) {
        throw new Error("Server not initialized");
      }
      wss = new WebSocket.Server({
        server,
      });
      console.log("starting wss on port %d", getWSSPort());
      wss.on("connection", function connection(ws) {
        ws.on("message", function incoming(event) {
          const message = JSON.parse(event.toString());
          pubsub.emit(message.type, message.payload);
        });
      });
    })
    .listen();
};
