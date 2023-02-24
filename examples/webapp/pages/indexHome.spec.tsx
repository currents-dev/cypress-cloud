import React from "react";
import Home from "./index";

describe("<Home />", () => {
  it("renders", () => {
    // see: https://on.cypress.io/mounting-react
    cy.mount(<Home />);
    cy.contains("About");
    cy.contains("Another");
  });
});
