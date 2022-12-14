import fs from "fs";

// @ts-ignore
export const currents = async (on, config) => {
  if (!config.env.currents_temp_file) {
    console.debug(
      "env.currents_temp_file is undefined, skipping currents setup"
    );
    return config;
  } else {
    fs.writeFileSync(config.env.currents_temp_file, JSON.stringify(config));
  }
};
