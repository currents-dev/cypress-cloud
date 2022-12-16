// throw new Error('oj!')
describe('Skipped', function () {
  // before(() => {
  //   throw new Error('Skip me!');
  // });
  it.skip('Test A', function () {
    cy.visit('/');
    cy.get('#simpleSearch').type('Africa');
    cy.get('.suggestions-result').first().click();
    cy.scrollTo(0, 1200);

    cy.contains('adssaf');
  });
  it('Test B', function () {
    cy.visit('/');
    cy.get('#simpleSearch').type('Africa');
    cy.get('.suggestions-result').first().click();
    cy.scrollTo(0, 1200);
    cy.contains('giraffes');
  });
});
