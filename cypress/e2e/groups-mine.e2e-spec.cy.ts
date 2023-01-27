describe('groups mine page', () => {
  beforeEach(() => {
    cy.navigateTo('/groups/mine');
  });

  it('should display default activities in the left nav', () => {
    cy.get('.left .tab-left-nav [role=tab][aria-selected=true]').should('be.visible').should('have.text', 'Groups');
  });
});
