import WebSocket from "ws";
import { bus } from "../bus";

const wss = new WebSocket.Server({ port: 8765 });

wss.on("connection", function connection(ws) {
  ws.on("message", function incoming(message) {
    if (message.toString() === "after") {
      console.log("Emitting AFTER");
      bus.emit("after");
    }
  });
  console.log("new socket connection 🎉");

  const text = JSON.stringify({
    command: "reload",
  });
  ws.send(text);
});
