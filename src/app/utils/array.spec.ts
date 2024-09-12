import { median } from './array';

describe('median', () => {
  it('should throw error if the list is empty', () => {
    expect(() => median([])).toThrowError();
  });
  it('should work with a single element list', () => {
    expect(median([5])).toEqual(5);
  });
  it('should work with a odd number of values', () => {
    expect(median([2, 4, 8])).toEqual(4);
    expect(median([4, 2, 8])).toEqual(4);
    expect(median([8, 2, 4])).toEqual(4);
  });
  it('should work (avg the 2 medians) with an even number of values', () => {
    expect(median([2, 4, 5, 10])).toEqual(4.5);
    expect(median([5, 4, 2, 10])).toEqual(4.5);
    expect(median([4, 2, 10, 5])).toEqual(4.5);
  });
  it('should not modify the input list', () => {
    const list = [4, 2, 3];
    median(list);
    expect(list).toEqual([4, 2, 3]);
  });
});
