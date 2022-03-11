import { convertToParamMap, Params } from '@angular/router';
import { boolToQueryParamValue, queryParamValueToBool, urlStringFromArray } from './url';

describe('urlStringFromArray', () => {
  it('should convert correctly a complex absolute case', () => {
    expect(urlStringFromArray([ '/', 'activities', 'by-id', '123', { attemptId: '99', path: [ '4','5','6' ] }, 'details' ]))
      .toEqual('/activities/by-id/123;attemptId=99;path=4,5,6/details');
  });

  it('should convert correctly a complex relative case', () => {
    expect(urlStringFromArray([ 'by-id', '123', { attemptId: '99', path: [ '4','5','6' ] }, 'details' ]))
      .toEqual('by-id/123;attemptId=99;path=4,5,6/details');
  });

});

describe('bool value in url processing', () => {
  const field = 'demoField';

  it('should encode correctly a truthy value', () => {
    const params: Params = {};
    params[field] = boolToQueryParamValue(true);
    const map = convertToParamMap(params);
    expect(queryParamValueToBool(map.get(field))).toBeTrue();
  });

  it('should encode correctly a falsy value', () => {
    const params: Params = {};
    params[field] = boolToQueryParamValue(false);
    const map = convertToParamMap(params);
    expect(queryParamValueToBool(map.get(field))).toBeFalse();
  });

  it('should correctly handle field not set', () => {
    const map = convertToParamMap({ 'anotherField': 1 });
    expect(queryParamValueToBool(map.get(field))).toBeNull();
  });

});
