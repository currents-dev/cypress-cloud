import fs from "fs";

const WebSocket = require("ws");

// @ts-ignore
export const currents = async (on, config) => {
  // Create the WebSocket client

  if (!config.env.currents_temp_file) {
    console.warn(
      "env.currents_temp_file is undefined, skipping currents setup"
    );
    return config;
  }

  fs.writeFileSync(config.env.currents_temp_file, JSON.stringify(config));

  //   const client = new WebSocket(`ws://localhost:${config.env.currents_port}`);
  //   client.on("close", () => {
  //     console.log("client closed");
  //   });
  //   //@ts-ignore
  //   client.on("error", (err) => {
  //     console.log("error", err);
  //   });
  //   client.on("message", function incoming(data: string) {
  //     console.log("Received message", data);
  //   });
  //   client.on("open", function open() {
  //     client.send(JSON.stringify({ type: "config", payload: config }));
  //   });
};
