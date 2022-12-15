module.exports = {
  verbose: true,
  testEnvironment: "node",
  testMatch: ["<rootDir>/**/__tests__/**/?(*.)(spec|test).ts"],
  transform: {
    "^.+\\.tsx?$": "jest-esbuild",
  },
  moduleNameMapper: {
    "cypress-runner/(.*)$": "<rootDir>/../cypress-runner/$1",
  },
  transformIgnorePatterns: ["node_modules"],
  moduleFileExtensions: ["ts", "js", "d.ts"],
};
