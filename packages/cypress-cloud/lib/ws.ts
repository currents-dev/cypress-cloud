import WebSocket from "ws";
import { bus } from "../bus";

const wss = new WebSocket.Server({ port: 8765 });

wss.on("connection", function connection(ws) {
  ws.on("message", function incoming(event) {
    console.log("received: %s", event);
    const message = JSON.parse(event.toString());
    if (message?.type === "after:spec") {
      console.log("Emitting after:spec");
      bus.emit("after:spec", message.payload);
    }
  });
  console.log("new socket connection 🎉");

  // const text = JSON.stringify({
  //   command: "reload",
  // });
  // ws.send(text);
});
