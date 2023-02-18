require("cypress-terminal-report/src/installLogsCollector")();
require("@currents/cypress/support");
require("./commands");
beforeEach(() => {
  cy.visit("/");
});
