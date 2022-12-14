import fs from "fs";
// import * as capture from "../lib/capture";
// const stdout = capture.stdout();

// @ts-ignore
export const currents = async (on, config) => {
  // console.log("🤬 Installing stdout capture");
  // // @ts-ignore
  // on("after:run", (results) => {
  //   // console.log("after:run", results);
  //   console.log("after:run", stdout.toString());
  // });

  if (!config.env.currents_temp_file) {
    console.debug(
      "env.currents_temp_file is undefined, skipping currents setup"
    );
    return config;
  } else {
    fs.writeFileSync(config.env.currents_temp_file, JSON.stringify(config));
  }
};
