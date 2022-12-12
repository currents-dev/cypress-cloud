describe('No tests', function () {
  it.skip('A ', function () {
    cy.visit('/');
    cy.get('#simpleSearch').type('Africa');
    cy.get('.suggestions-result').first().click();
    cy.scrollTo(0, 1200);

    cy.contains('adssaf');
  });
  it.skip('B ', function () {
    cy.visit('/');
    cy.get('#simpleSearch').type('Africa');
    cy.get('.suggestions-result').first().click();
    cy.scrollTo(0, 1200);
    cy.contains('giraffes');
  });
});
