describe("Home page", function () {
  it("loads properly", function () {
    cy.visit("/");
    cy.get(".header").happoScreenshot();
  });
});
