Cypress.Commands.add('displayFirstActivity', () => {
  cy.get('.p-treenode-content').first().should('be.visible').should('have.text', ' Parcours officiels ');
});

Cypress.Commands.add('navigateTo', (relativeUrl: string) => {
  cy.visit(relativeUrl);
});

Cypress.Commands.add('navigateToActivity', (itemId: string, path?: string[]) => {
  const url = [
    `/activities/by-id/${itemId}`,
    path && `;path=${path.join(',')}`,
    ';parentAttempId=0',
  ].filter(Boolean).join('');

  cy.visit(url);
  cy.url().should('contain', url);
});

Cypress.Commands.add('navigateToGroup', (groupId: string) => {
  cy.navigateTo(`/groups/by-id/${groupId}`);
});

Cypress.Commands.add('navigateToUser', (userId: string) => {
  cy.navigateTo(`/groups/users/${userId}`);
});

Cypress.Commands.add('authenticate', () => {
  const authTokenKey = String(Cypress.env('E2E_AUTH_TOKEN_KEY'));
  const authTokenValue = String(Cypress.env('E2E_AUTH_TOKEN_VALUE'));
  if (!authTokenKey || !authTokenValue) throw new Error('Env var "E2E_AUTH_TOKEN_KEY, E2E_AUTH_TOKEN_VALUE" must be provided');
  window.sessionStorage.setItem(authTokenKey, authTokenValue);
});

declare namespace Cypress {
  interface Chainable {
    navigateTo(relativeUrl: string): Chainable<void>,
    navigateToActivity(itemId: string, path?: string[]): Chainable<void>,
    navigateToGroup(groupId: string): Chainable<void>,
    navigateToUser(userId: string): Chainable<void>,
    authenticate(): Chainable<void>,
    displayFirstActivity(): Chainable<Element>,
  }
}

