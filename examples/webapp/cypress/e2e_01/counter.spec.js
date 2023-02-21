let TODO_ITEM_ONE = "buy some cheese";
let TODO_ITEM_TWO = "feed the cat";
let TODO_ITEM_THREE = "book a doctors appointment";

context("Counter", function () {
  it("should display the current number of todo items", function () {
    cy.createTodo(TODO_ITEM_ONE);
    cy.get(".todo-count").contains("1 item left");
    cy.createTodo(TODO_ITEM_TWO);
    cy.get(".todo-count").contains("2 items left");
  });
});
