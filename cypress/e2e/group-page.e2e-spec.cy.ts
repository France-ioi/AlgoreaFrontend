describe('groups/users page', () => {
  describe('user page', () => {
    const user = {
      id: '670968966872011405',
      name: 'arbonenfant',
    };
    beforeEach(() => {
      cy.navigateToUser(user.id);
    });

    it('should display default activities in the left nav', () => {
      cy.displayFirstActivity();
    });
  });

  describe('group page', () => {
    const group = {
      id: '672913018859223173',
      name: 'Pixal',
    };
    beforeEach(() => {
      cy.authenticate();
      cy.navigateToGroup(group.id);
    });

    it('should present nav bar with active tab "groups"', () => {
      cy.get('.left .tab-left-nav [role=tab][aria-selected=true]').should('be.visible').should('have.text', 'Groups');
    });
  });

  describe('unexisting group page', () => {
    beforeEach(() => {
      cy.authenticate();
      cy.navigateToGroup('1234');
    });

    it('should have an empty left nav with an error message and retry cta', () => {
      cy.get('.left .tab-left-nav [role=tab][aria-selected=true]').should('be.visible').should('have.text', 'Groups');
    });
  });
});
