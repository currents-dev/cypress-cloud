import Debug from "debug";
import http from "http";
// @ts-ignore
import HttpTerminator from "lil-http-terminator";
import { match, P } from "ts-pattern";
import * as WebSocket from "ws";
import { pubsub } from "../pubsub";

const debug = Debug("currents:ws");

let server: http.Server | null = null;
let wss: WebSocket.Server | null = null;
let httpTerminator: HttpTerminator | null = null;

export const getWSSPort = () =>
  match(server?.address())
    .with({ port: P.number }, (address) => address.port)
    .otherwise(() => 0);

export const stopWSS = async () => {
  debug("terminating wss server: %d", getWSSPort());
  if (!httpTerminator) {
    debug("no wss server");
    return;
  }
  const { success, code, message, error } = await httpTerminator.terminate();
  if (!success) {
    if (code === "TIMED_OUT") error(message);
    if (code === "SERVER_ERROR") error(message, error);
    if (code === "INTERNAL_ERROR") error(message, error);
  }
  debug("terminated wss server: %d", getWSSPort());
};
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
      wss = new WebSocket.WebSocketServer({
        server,
      });
      debug("starting wss on port %d", getWSSPort());
      wss.on("connection", function connection(ws) {
        ws.on("message", function incoming(event) {
          const message = JSON.parse(event.toString());
          pubsub.emit(message.type, message.payload);
        });
      });
    })
    .listen();

  httpTerminator = HttpTerminator({
    server,
  });
};
