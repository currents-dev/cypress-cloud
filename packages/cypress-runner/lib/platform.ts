import { platform, release, cpus, freemem, totalmem } from "os";
import { promisify } from "util";
import getos from "getos";

const getOsVersion = async () => {
  if (platform() === "linux") {
    try {
      const linuxOs = await promisify(getos)();
      if ("dist" in linuxOs && "release" in linuxOs) {
        return [linuxOs.dist, linuxOs.release].join(" - ");
      } else {
        return release();
      }
    } catch {
      return release();
    }
  }
  return release();
};

export const getPlatformInfo = async () => {
  const osVersion = await getOsVersion();
  return {
    osName: platform(),
    osVersion,
    osCpus: cpus(),
    osMemory: {
      free: freemem(),
      total: totalmem(),
    },
  };
};
