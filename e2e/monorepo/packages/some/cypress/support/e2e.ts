import registerCypressGrep from "@cypress/grep/src/support";
require("cypress-terminal-report/src/installLogsCollector")();
require("@deploysentinel/cypress-cloud/support");
require("./commands");

registerCypressGrep();
beforeEach(() => {
  cy.visit("/");
});
