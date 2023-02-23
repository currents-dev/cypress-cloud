/// <reference types="Cypress" />

import waitUntil from "async-wait-until";
const ws = new WebSocket("ws://localhost:8765");

beforeEach(() => {
  cy.log("currents_ws", Cypress.env("currents_ws"));
});

before(() => {
  if (!Cypress.env("currents_ws")) {
    return;
  }
  cy.wrap(
    waitUntil(() => ws.readyState === WebSocket.OPEN, 2000, 50),
    { log: false }
  ).then(() => {
    cy.log("ws", "connected");
    ws.send(JSON.stringify(Cypress.spec));
  });
});

afterEach(() => {
  // ws.send("afterEach");
});

after(() => {
  // ws.send("after");
});
