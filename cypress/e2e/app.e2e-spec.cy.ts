describe('Algorea Frontend', () => {
  beforeEach(() => {
    cy.navigateTo('/');
  });

  describe('page static elements', () => {
    it('should shows the title', () => {
      cy.get('.platform-name').should('be.visible').should('have.text', 'Algorea Platform');
    });

    it('should have clickable activity', () => {
      cy.get('p-treenode').first().should('be.visible').click();
    });

    it('should have a working collapse button', () => {
      cy.get('[data-cy="left-menu-btn"]').should('be.visible').click();
    });
  });

  describe('activities elements', () => {
    it('should shows the first element of the activity tree', () => {
      cy.displayFirstActivity();
    });
  });
});

