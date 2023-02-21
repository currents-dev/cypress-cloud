let TODO_ITEM_ONE = "buy some cheese";
let TODO_ITEM_TWO = "feed the cat";
let TODO_ITEM_THREE = "book a doctors appointment";

context("New Todo", function () {
  // New commands used here:
  // https://on.cypress.io/type
  // https://on.cypress.io/eq
  // https://on.cypress.io/find
  // https://on.cypress.io/contains
  // https://on.cypress.io/should
  // https://on.cypress.io/as

  it("should allow me to add todo items", function () {
    // create 1st todo
    cy.get(".new-todo").type(TODO_ITEM_ONE).type("{enter}");

    // make sure the 1st label contains the 1st todo text
    cy.get(".todo-list li")
      .eq(0)
      .find("label")
      .should("contain", TODO_ITEM_ONE);

    // create 2nd todo
    cy.get(".new-todo").type(TODO_ITEM_TWO).type("{enter}");

    // make sure the 2nd label contains the 2nd todo text
    cy.get(".todo-list li")
      .eq(1)
      .find("label")
      .should("contain", TODO_ITEM_TWO);
  });

  it("adds items", function () {
    // create several todos then check the number of items in the list
    cy.get(".new-todo")
      .type("todo A{enter}")
      .type("todo B{enter}") // we can continue working with same element
      .type("todo C{enter}") // and keep adding new items
      .type("todo D{enter}");

    cy.get(".todo-list li").should("have.length", 4);
  });

  it("should clear text input field when an item is added", function () {
    cy.get(".new-todo").type(TODO_ITEM_ONE).type("{enter}");

    cy.get(".new-todo").should("have.text", "");
  });

  it("should append new items to the bottom of the list", function () {
    // this is an example of a custom command
    // defined in cypress/support/commands.js
    cy.createDefaultTodos().as("todos");

    // even though the text content is split across
    // multiple <span> and <strong> elements
    // `cy.contains` can verify this correctly
    cy.get(".todo-count").contains("3 items left");

    cy.get("@todos").eq(0).find("label").should("contain", TODO_ITEM_ONE);

    cy.get("@todos").eq(1).find("label").should("contain", TODO_ITEM_TWO);

    cy.get("@todos").eq(2).find("label").should("contain", TODO_ITEM_THREE);
  });

  it("should show #main and #footer when items added", function () {
    cy.createTodo(TODO_ITEM_ONE);
    cy.get(".main").should("be.visible");
    cy.get(".footer").should("be.visible");
  });
});
