import { TestBed } from '@angular/core/testing';
import { AvatarCacheService } from './avatar-cache.service';
import { Avatar } from './avatar';

const MAX_CACHE_ENTRIES = 30;

function fakeAvatar(tag: string): Avatar {
  return {
    wrapperColor: `#${tag}`,
    faceColor: '#000000',
    backgroundColor: '#FFFFFF',
    wrapperTranslateX: 0,
    wrapperTranslateY: 0,
    wrapperRotate: 0,
    wrapperScale: 1,
    isMouthOpen: false,
    isCircle: false,
    eyeSpread: 0,
    mouthSpread: 0,
    faceRotate: 0,
    faceTranslateX: 0,
    faceTranslateY: 0,
  };
}

describe('AvatarCacheService', () => {
  let service: AvatarCacheService;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [ AvatarCacheService ],
    });
    service = TestBed.inject(AvatarCacheService);
  });

  describe('get', () => {
    it('should return undefined for an unknown seed', () => {
      expect(service.get('missing')).toBeUndefined();
    });

    it('should return the previously stored avatar for a known seed', () => {
      const avatar = fakeAvatar('aaa');
      service.set('seed-1', avatar);

      expect(service.get('seed-1')).toBe(avatar);
    });
  });

  describe('set', () => {
    it('should overwrite the avatar when called twice with the same seed', () => {
      const first = fakeAvatar('aaa');
      const second = fakeAvatar('bbb');

      service.set('seed-1', first);
      service.set('seed-1', second);

      expect(service.get('seed-1')).toBe(second);
    });

    it(`should evict the oldest entry once the cache exceeds ${MAX_CACHE_ENTRIES} entries`, () => {
      for (let i = 0; i < MAX_CACHE_ENTRIES; i++) {
        service.set(`seed-${i}`, fakeAvatar(`a${i}`));
      }

      // Insert one more entry to push past capacity; the oldest (`seed-0`) must be evicted.
      service.set(`seed-${MAX_CACHE_ENTRIES}`, fakeAvatar('overflow'));

      expect(service.get('seed-0')).toBeUndefined();
      expect(service.get(`seed-${MAX_CACHE_ENTRIES}`)).toBeDefined();
      expect(service.get('seed-1')).toBeDefined();
    });

    it('should keep recently accessed entries when evicting (LRU behaviour)', () => {
      for (let i = 0; i < MAX_CACHE_ENTRIES; i++) {
        service.set(`seed-${i}`, fakeAvatar(`a${i}`));
      }

      // Promote seed-0 to "most recently used" so it should survive the next eviction.
      service.get('seed-0');

      service.set(`seed-${MAX_CACHE_ENTRIES}`, fakeAvatar('overflow'));

      expect(service.get('seed-0')).toBeDefined();
      // seed-1 was the oldest after promoting seed-0, so it must have been evicted instead.
      expect(service.get('seed-1')).toBeUndefined();
    });
  });

  describe('getOrCreate', () => {
    it('should invoke the factory and cache its result on a miss', () => {
      const built = fakeAvatar('aaa');
      const factory = jasmine.createSpy('factory').and.returnValue(built);

      const result = service.getOrCreate('seed-1', factory);

      expect(result).toBe(built);
      expect(factory).toHaveBeenCalledTimes(1);
      expect(service.get('seed-1')).toBe(built);
    });

    it('should return the cached avatar without invoking the factory on a hit', () => {
      const cached = fakeAvatar('aaa');
      service.set('seed-1', cached);
      const factory = jasmine.createSpy('factory').and.returnValue(fakeAvatar('bbb'));

      const result = service.getOrCreate('seed-1', factory);

      expect(result).toBe(cached);
      expect(factory).not.toHaveBeenCalled();
    });
  });

  describe('ngOnDestroy', () => {
    it('should clear all cached entries', () => {
      service.set('seed-1', fakeAvatar('aaa'));
      service.set('seed-2', fakeAvatar('bbb'));

      service.ngOnDestroy();

      expect(service.get('seed-1')).toBeUndefined();
      expect(service.get('seed-2')).toBeUndefined();
    });
  });
});
