describe("Home page", function () {
  this.beforeAll(() => {
    cy.log("I run once before all tests in the block");
  });

  it("loads properly", function () {
    cy.visit("/");
    cy.log("log from cypress");
    cy.get(".header").happoScreenshot();
  });
});
