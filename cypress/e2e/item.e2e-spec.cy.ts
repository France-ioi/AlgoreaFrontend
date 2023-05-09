describe('item page', () => {
  describe('activity page', () => {
    const motifArt = {
      id: '1625159049301502151',
      title: 'MOTIF ART',
      path: [ '4702' ],
    };

    const pageLoadUseCases = [
      { label: 'without path', path: undefined },
      { label: 'with correct path', path: motifArt.path },
      { label: 'with incorrect path', path: [ '111', '999' ] }, // trigger forbidden
      { label: 'with incorrect path with non-numbers', path: [ 'invalid', 'path' ] }, // trigger 404
    ];
    for (const useCase of pageLoadUseCases) {
      it(`should load ${useCase.label}`, () => {
        cy.navigateToActivity(motifArt.id, useCase.path);
        cy.get('[data-cy="item-title"]').should('be.visible').should('have.text', motifArt.title);
      });
    }
  });
});
