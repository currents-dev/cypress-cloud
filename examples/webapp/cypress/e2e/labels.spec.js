// type definitions for Cypress object "cy"
/// <reference types="cypress" />

describe("TodoMVC", function () {
  it(
    "adds 2 todos",
    {
      some: "thing",
      meta: "data",
    },
    function () {
      cy.get(".new-todo").type("learn testing{enter}").type("be cool{enter}");

      cy.get(".todo-list li").should("have.length", 2);
    }
  );
});
