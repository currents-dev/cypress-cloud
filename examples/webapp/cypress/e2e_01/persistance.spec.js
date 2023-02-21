let TODO_ITEM_ONE = "buy some cheese";
let TODO_ITEM_TWO = "feed the cat";
let TODO_ITEM_THREE = "book a doctors appointment";

context("Persistence", function () {
  it("should persist its data", function () {
    // mimicking TodoMVC tests
    // by writing out this function
    function testState() {
      cy.get("@firstTodo")
        .should("contain", TODO_ITEM_ONE)
        .and("have.class", "completed");

      cy.get("@secondTodo")
        .should("contain", TODO_ITEM_TWO)
        .and("not.have.class", "completed");
    }

    cy.createTodo(TODO_ITEM_ONE).as("firstTodo");
    cy.createTodo(TODO_ITEM_TWO).as("secondTodo");
    cy.get("@firstTodo")
      .find(".toggle")
      .check()
      .then(testState)

      .reload()
      .then(testState);
  });
});
