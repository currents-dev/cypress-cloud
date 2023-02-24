import React from "react";
import Home from "../index.page";

describe("<Home />", () => {
  it("renders", () => {
    // see: https://on.cypress.io/mounting-react
    cy.mount(<Home />);
    cy.contains("About");
    cy.contains("Another");
  });
});
