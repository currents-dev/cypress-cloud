import registerCypressGrep from "@cypress/grep/src/support";
require("cypress-terminal-report/src/installLogsCollector")();
require("@deploysentinel/cypress-parallel/support");
require("./commands");

registerCypressGrep();
beforeEach(() => {
  cy.visit("/");
});
