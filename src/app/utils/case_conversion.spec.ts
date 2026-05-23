import { camelToSnakeKeys, snakeToCamelKeys } from './case_conversion';

describe('snakeToCamelKeys', () => {

  it('should not change a string', () => {
    expect(snakeToCamelKeys('test_val')).toEqual('test_val');
  });

  it('should not change a number', () => {
    expect(snakeToCamelKeys(2)).toEqual(2);
  });

  it('should not change a simple array', () => {
    expect(snakeToCamelKeys([ 1, 2, 5 ])).toEqual([ 1, 2, 5 ]);
  });

  it('should convert with an object', () => {
    expect(snakeToCamelKeys({
      snake_case: 'string_not_to_changed',
      alreadyCamelCase: 3,
      several_under_scores: 4,
      regularkey: 5,
    })).toEqual({
      snakeCase: 'string_not_to_changed',
      alreadyCamelCase: 3,
      severalUnderScores: 4,
      regularkey: 5,
    });
  });

  it('should convert nested object', () => {
    expect(snakeToCamelKeys({
      dict: { a_dog: 2, acat: 3 },
      array_key: [ 4, 5 ]
    })).toEqual({
      dict: { aDog: 2, acat: 3 },
      arrayKey: [ 4, 5 ]
    });
  });

  it('should convert elements of an array', () => {
    expect(snakeToCamelKeys([{ demo_snake: 1 }, { regular_one: 'all_good' }])).toEqual([{ demoSnake: 1 }, { regularOne: 'all_good' }]);
  });

});

describe('camelToSnakeKeys', () => {

  it('should not change a string', () => {
    expect(camelToSnakeKeys('testVal')).toEqual('testVal');
  });

  it('should not change a number', () => {
    expect(camelToSnakeKeys(2)).toEqual(2);
  });

  it('should not change a simple array', () => {
    expect(camelToSnakeKeys([ 1, 2, 5 ])).toEqual([ 1, 2, 5 ]);
  });

  it('should convert an object', () => {
    expect(camelToSnakeKeys({
      titleBarVisible: true,
      already_snake: 3,
      severalUnderScores: 4,
    })).toEqual({
      title_bar_visible: true,
      already_snake: 3,
      several_under_scores: 4,
    });
  });

  it('should convert nested objects and array elements', () => {
    expect(camelToSnakeKeys({
      displaySettings: { childrenLayout: 'Grid' },
      itemsList: [ { itemId: '1' } ],
    })).toEqual({
      display_settings: { children_layout: 'Grid' },
      items_list: [ { item_id: '1' } ],
    });
  });

});
