context("No Todos", function () {
  it("should hide #main and #footer", function () {
    // Unlike the TodoMVC tests, we don't need to create
    // a gazillion helper functions which are difficult to
    // parse through. Instead we'll opt to use real selectors
    // so as to make our testing intentions as clear as possible.
    //
    // http://on.cypress.io/get
    cy.get(".todo-list li").should("not.exist");
    cy.get('[data-layer="Content"]').should("not.exist");
    cy.get(".footer").should("not.be.visible");
  });
});
