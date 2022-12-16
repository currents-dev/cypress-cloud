import { findSpecs } from "../specMatcher";

describe("Spec Matcher", () => {
  xit("runs multiple spec files when comma separated", async () => {
    console.log(__dirname);
    await findSpecs({
      projectRoot: __dirname,
      testingType: "e2e",
      specPattern: ["fixtures/*.cy.ts"],
      configSpecPattern: ["fixtures/*.cy.ts"],
      excludeSpecPattern: [],
      additionalIgnorePattern: [],
    });
  });
});
