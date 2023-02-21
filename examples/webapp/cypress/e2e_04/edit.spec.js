let TODO_ITEM_ONE = "buy some cheese";
let TODO_ITEM_TWO = "feed the cat";
let TODO_ITEM_THREE = "book a doctors appointment";

context("Editing", function () {
  // New commands used here:
  // - cy.blur    https://on.cypress.io/api/blur

  beforeEach(function () {
    cy.createDefaultTodos().as("todos");
  });

  it("should hide other controls when editing", function () {
    cy.get("@todos").eq(1).as("secondTodo").find("label").dblclick();

    cy.get("@secondTodo").find(".toggle").should("not.be.visible");

    cy.get("@secondTodo").find("label").should("not.be.visible");
  });

  it("should save edits on blur", function () {
    cy.get("@todos").eq(1).as("secondTodo").find("label").dblclick();

    cy.get("@secondTodo")
      .find(".edit")
      .clear()
      .type("buy some sausages")
      // we can just send the blur event directly
      // to the input instead of having to click
      // on another button on the page. though you
      // could do that its just more mental work
      .blur();

    cy.get("@todos").eq(0).should("contain", TODO_ITEM_ONE);

    cy.get("@secondTodo").should("contain", "buy some sausages");
    cy.get("@todos").eq(2).should("contain", TODO_ITEM_THREE);
  });

  it("should trim entered text", function () {
    cy.get("@todos").eq(1).as("secondTodo").find("label").dblclick();

    cy.get("@secondTodo")
      .find(".edit")
      .clear()
      .type("    buy some sausages    ")
      .type("{enter}");

    cy.get("@todos").eq(0).should("contain", TODO_ITEM_ONE);

    cy.get("@secondTodo").should("contain", "buy some sausages");
    cy.get("@todos").eq(2).should("contain", TODO_ITEM_THREE);
  });

  it("should remove the item if an empty text string was entered", function () {
    cy.get("@todos").eq(1).as("secondTodo").find("label").dblclick();

    cy.get("@secondTodo").find(".edit").clear().type("{enter}");

    cy.get("@todos").should("have.length", 2);
  });

  it("should cancel edits on escape", function () {
    cy.get("@todos").eq(1).as("secondTodo").find("label").dblclick();

    cy.get("@secondTodo").find(".edit").clear().type("foo{esc}");

    cy.get("@todos").eq(0).should("contain", TODO_ITEM_ONE);

    cy.get("@todos").eq(1).should("contain", TODO_ITEM_TWO);

    cy.get("@todos").eq(2).should("contain", TODO_ITEM_THREE);
  });
});
