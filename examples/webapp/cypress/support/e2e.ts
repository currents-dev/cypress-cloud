require("cypress-terminal-report/src/installLogsCollector")();
require("cypress-cloud/support");
require("./commands");
beforeEach(() => {
  cy.visit("/");
});
