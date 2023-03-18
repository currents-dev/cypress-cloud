import React from "react";
import About from "../about.page";

describe("<About />", () => {
  it("renders", () => {
    // see: https://on.cypress.io/mounting-react
    cy.mount(<About />);
    cy.contains("About Page");
  });
});
