describe("Screenshots", function () {
  it("Test A", function () {
    cy.visit("/");
    cy.get("#simpleSearch").type("Africa");
    cy.screenshot("Africa!");
    cy.get(".suggestions-result").first().click();
    cy.scrollTo(0, 1200);
  });
});
