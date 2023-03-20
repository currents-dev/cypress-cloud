let TODO_ITEM_ONE = "buy some cheese";
let TODO_ITEM_TWO = "feed the cat";
let TODO_ITEM_THREE = "book a doctors appointment";

context("Clear completed button", function () {
  beforeEach(function () {
    cy.createDefaultTodos().as("todos");
  });

  it(
    "should display the correct text",
    {
      tags: ["@tagA"],
    },
    function () {
      cy.get("@todos").eq(0).find(".toggle").check();

      cy.get(".clear-completed").contains("Clear completed");
    }
  );

  it(
    "should remove completed items when clicked",
    {
      tags: ["@tagB"],
    },
    function () {
      cy.get("@todos").eq(1).find(".toggle").check();

      cy.get(".clear-completed").click();
      cy.get("@todos").should("have.length", 2);
      cy.get(".todo-list li").eq(0).should("contain", TODO_ITEM_ONE);
      cy.get(".todo-list li").eq(1).should("contain", TODO_ITEM_THREE);
    }
  );

  it("should be hidden when there are no items that are completed", function () {
    cy.get("@todos").eq(1).find(".toggle").check();

    cy.get(".clear-completed").should("be.visible").click();

    cy.get(".clear-completed").should("not.be.visible");
  });
});
