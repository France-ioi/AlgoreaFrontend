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
      { label: 'with incorrect path', path: [ '111', '999' ] },
      { label: 'with incorrect path with non-numbers', path: [ 'invalid', 'path' ] },
    ];
    for (const useCase of pageLoadUseCases) {
      it(`should load ${useCase.label}`, () => {
        cy.navigateToActivity(motifArt.id, useCase.path);
        cy.get('alg-item-header .task-title').should('be.visible').should('have.text', motifArt.title);
      });
    }
  });
});
