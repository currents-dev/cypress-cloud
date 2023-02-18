context("Mark all as completed", function () {
  // New commands used here:
  // - cy.check    https://on.cypress.io/api/check
  // - cy.uncheck  https://on.cypress.io/api/uncheck

  beforeEach(function () {
    // This is an example of aliasing
    // within a hook (beforeEach).
    // Aliases will automatically persist
    // between hooks and are available
    // in your tests below
    cy.createDefaultTodos().as("todos");
  });

  it("should allow me to mark all items as completed", function () {
    // complete all todos
    // we use 'check' instead of 'click'
    // because that indicates our intention much clearer
    cy.get(".toggle-all").check();

    // get each todo li and ensure its class is 'completed'
    cy.get("@todos").eq(0).should("have.class", "completed");

    cy.get("@todos").eq(1).should("have.class", "completed");

    cy.get("@todos").eq(2).should("have.class", "completed");
  });

  it("should allow me to clear the complete state of all items", function () {
    // check and then immediately uncheck
    cy.get(".toggle-all").check().uncheck();

    cy.get("@todos").eq(0).should("not.have.class", "completed");

    cy.get("@todos").eq(1).should("not.have.class", "completed");

    cy.get("@todos").eq(2).should("not.have.class", "completed");
  });

  it("complete all checkbox should update state when items are completed / cleared", function () {
    // alias the .toggle-all for reuse later
    cy.get(".toggle-all")
      .as("toggleAll")
      .check()
      // this assertion is silly here IMO but
      // it is what TodoMVC does
      .should("be.checked");

    // alias the first todo and then click it
    cy.get(".todo-list li").eq(0).as("firstTodo").find(".toggle").uncheck();

    // reference the .toggle-all element again
    // and make sure its not checked
    cy.get("@toggleAll").should("not.be.checked");

    // reference the first todo again and now toggle it
    cy.get("@firstTodo").find(".toggle").check();

    // assert the toggle all is checked again
    cy.get("@toggleAll").should("be.checked");
  });
});
