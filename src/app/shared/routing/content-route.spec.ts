import { closestBreadcrumbs } from './content-route';

const basePath = [ '1', '2', '3' ];

function wrap(path: string[]): { id: string }[] {
  return path.map(e => ({ id: e }));
}

describe('closestPath', () => {
  it('should throw an exception if the list is empty', () => {
    expect(function () {
      closestBreadcrumbs(basePath, []);
    }).toThrow();
  });

  it('should return the only path if there is only one path', () => {
    expect(closestBreadcrumbs(basePath, [ wrap([ '1', '2', '3' ]) ])).toEqual(wrap([ '1', '2', '3' ]));
    expect(closestBreadcrumbs(basePath, [ wrap([ '4', '5' ]) ])).toEqual(wrap([ '4', '5' ]));
  });

  it('should return the path with the longest subpath', () => {
    expect(closestBreadcrumbs(basePath, [ [ '4', '5' ], [ '1', '2', '5' ], [ '1', '5' ] ].map(wrap))).toEqual(wrap([ '1', '2', '5' ]));
  });

  it('should return the shortest if there are several ones with the same prefix length', () => {
    expect(closestBreadcrumbs(basePath, [ [ '1' ], [ '1', '2', '5' ], [ '1', '2', '4', '5' ] ].map(wrap))).toEqual(wrap([ '1', '2', '5' ]));
    expect(closestBreadcrumbs(basePath, [ [ '1' ], [ '1', '2', '4', '5' ], [ '1', '2', '5' ] ].map(wrap))).toEqual(wrap([ '1', '2', '5' ]));
  });

  it('should return the shortest if there is a full match of the base', () => {
    expect(closestBreadcrumbs(basePath, [ [ '1' ], [ '1', '2', '3', '5' ], [ '1', '2', '3', '4', '5' ] ].map(wrap)))
      .toEqual(wrap([ '1', '2', '3', '5' ]));
    expect(closestBreadcrumbs(basePath, [ [ '1', '2', '3', '4', '5' ], [ '1', '2', '3', '5' ], [ '1' ] ].map(wrap)))
      .toEqual(wrap([ '1', '2', '3', '5' ]));
  });

});
