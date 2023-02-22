/// <reference types="Cypress" />

const insertToggleButton = require("./button");
import waitUntil from "async-wait-until";
const ws = new WebSocket("ws://localhost:8765");

let watchAndReloadEnabled = true;
const button = insertToggleButton();
button.onclick = () => {
  button.classList.toggle("auto-scrolling-enabled");
  watchAndReloadEnabled = !watchAndReloadEnabled;
};

before(() => {
  cy.wrap(
    waitUntil(() => ws.readyState === WebSocket.OPEN, 2000, 50),
    { log: false }
  ).then(() => {
    cy.log("ws", "connected");
    ws.send(JSON.stringify(Cypress.spec));
    ws.onmessage = (ev) => {
      cy.log("message from OS");
      cy.log("ss", ev);
      if (ev.type === "message" && ev.data) {
        try {
          const data = JSON.parse(ev.data);
          if (data.command === "reload" && data.filename) {
            if (watchAndReloadEnabled) {
              console.log(
                'reloading Cypress because "%s" has changed',
                data.filename
              );
              // if the button is unavailable, that means
              // the tests are probably already running
              // so let's reload the top window and they will restart again
              const restartBtn =
                window.top.document.querySelector(".reporter .restart");
              restartBtn ? restartBtn.click() : window.top.location.reload();
            }
          }
        } catch (e) {
          console.error("Could not parse message from plugin");
          console.error(e.message);
          console.error("original text");
          console.error(ev.data);
        }
      }
    };
  });
});

after(() => {
  ws.send("after");
});
