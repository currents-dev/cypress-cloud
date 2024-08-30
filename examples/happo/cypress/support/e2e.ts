require("cypress-cloud/support");
require("./commands");

beforeEach(() => {
  cy.visit("/");
});
