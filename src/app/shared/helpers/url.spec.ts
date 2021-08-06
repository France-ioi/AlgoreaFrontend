import { urlStringFromArray } from './url';

describe('urlStringFromArray', () => {
  fit('should convert correctly a complex absolute case', () => {
    expect(urlStringFromArray([ '/', 'activities', 'by-id', '123', { attemptId: '99', path: [ '4','5','6' ] }, 'details' ]))
      .toEqual('/activities/by-id/123;attemptId=99;path=4,5,6/details');
  });

  fit('should convert correctly a complex relative case', () => {
    expect(urlStringFromArray([ 'by-id', '123', { attemptId: '99', path: [ '4','5','6' ] }, 'details' ]))
      .toEqual('by-id/123;attemptId=99;path=4,5,6/details');
  });

});
