describe('Some tests fail', function () {
  it('Passing Test A', function () {
    cy.visit('/');
    cy.get('#simpleSearch').type('Africa');
    cy.get('.suggestions-result').first().click();
    cy.scrollTo(0, 1200);
    cy.contains('Africa');
  });
  it('Failing Test B', function () {
    cy.visit('/');
    cy.get('#simpleSearch').type('Africa');
    cy.get('.suggestions-result').first().click();
    cy.scrollTo(0, 1200);
    cy.contains('asdsadsadsada');
  });
});
