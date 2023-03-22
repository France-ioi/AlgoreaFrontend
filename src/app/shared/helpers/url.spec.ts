import { convertToParamMap, Params } from '@angular/router';
import { boolToQueryParamValue, queryParamValueToBool, urlStringFromArray } from './url';

describe('urlStringFromArray', () => {
  it('should convert correctly a complex absolute case', () => {
    expect(urlStringFromArray([ '/', 'a', '123', { a: '99', p: [ '4','5','6' ] }]))
      .toEqual('/a/123;a=99;p=4,5,6');
  });

  it('should convert correctly a complex relative case', () => {
    expect(urlStringFromArray([ '123', { a: '99', p: [ '4','5','6' ] }]))
      .toEqual('123;a=99;p=4,5,6');
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
