let TODO_ITEM_ONE = "buy some cheese";
let TODO_ITEM_TWO = "feed the cat";
let TODO_ITEM_THREE = "book a doctors appointment";

context("Item", function () {
  // New commands used here:
  // - cy.clear    https://on.cypress.io/api/clear

  it("should allow me to mark items as complete", function () {
    // we are aliasing the return value of
    // our custom command 'createTodo'
    //
    // the return value is the <li> in the <ul.todos-list>
    cy.createTodo(TODO_ITEM_ONE).as("firstTodo");
    cy.createTodo(TODO_ITEM_TWO).as("secondTodo");

    cy.get(".todo-list li").eq(0).as("firstTodo");
    cy.get(".todo-list li").eq(0).find(".toggle").check();

    cy.get(".todo-list li").eq(0).should("have.class", "completed");

    cy.get(".todo-list li").eq(1).should("not.have.class", "completed");
    cy.get(".todo-list li").eq(1).find(".toggle").check();

    cy.get(".todo-list li").eq(0).should("have.class", "completed");
    cy.get("@secondTodo").should("have.class", "completed");
  });

  it("should allow me to un-mark items as complete", function () {
    cy.createTodo(TODO_ITEM_ONE).as("firstTodo");
    cy.createTodo(TODO_ITEM_TWO).as("secondTodo");

    cy.get(".todo-list li").eq(0).as("firstTodo");
    cy.get("@firstTodo").find(".toggle").check();

    cy.get("@firstTodo").should("have.class", "completed");
    cy.get("@secondTodo").should("not.have.class", "completed");

    cy.get("@firstTodo").find(".toggle").uncheck();

    cy.get("@firstTodo").should("not.have.class", "completed");
    cy.get("@secondTodo").should("not.have.class", "completed");
  });

  it("should allow me to edit an item", function () {
    cy.createDefaultTodos().as("todos");

    cy.get("@todos")
      .eq(1)
      .as("secondTodo")
      // TODO: fix this, dblclick should
      // have been issued to label
      .find("label")
      .dblclick();

    // clear out the inputs current value
    // and type a new value
    cy.get("@secondTodo")
      .find(".edit")
      .clear()
      .type("buy some sausages")
      .type("{enter}");

    // explicitly assert about the text value
    cy.get("@todos").eq(0).should("contain", TODO_ITEM_ONE);

    cy.get("@secondTodo").should("contain", "buy some sausages");
    cy.get("@todos").eq(2).should("contain", TODO_ITEM_THREE);
  });
});
