describe('groups mine page', () => {
  beforeEach(() => {
    cy.navigateTo('/groups/mine');
  });

  it('should display default activities in the left nav', () => {
    cy.get('[data-cy="main-menu-group-btn"]').should('be.visible').should('have.text', 'Groups');
  });
});
