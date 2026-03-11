import { TestBed } from '@angular/core/testing';
import { of, throwError } from 'rxjs';
import { EntityResolutionCacheService } from './entity-resolution-cache.service';
import { GetUserService } from '../../groups/data-access/get-user.service';
import { GetItemByIdService } from '../../data-access/get-item-by-id.service';
import { UserSessionService } from '../../services/user-session.service';
import { User } from '../../groups/models/user';
import { Item } from '../../data-access/get-item-by-id.service';

const mockCurrentUser = {
  groupId: 'current-user-id',
  login: 'currentLogin',
  profile: { firstName: 'Current', lastName: 'User' },
};

function mockUser(overrides: Partial<User> = {}): User {
  return {
    login: 'testLogin',
    firstName: 'Test',
    lastName: 'User',
    groupId: 'user-1',
    tempUser: false,
    isCurrentUser: false,
    ancestorsCurrentUserIsManagerOf: [],
    ...overrides,
  } as User;
}

function mockItem(title: string): Item {
  return { string: { title } } as Item;
}

describe('EntityResolutionCacheService', () => {
  let service: EntityResolutionCacheService;
  let getUserService: jasmine.SpyObj<GetUserService>;
  let getItemByIdService: jasmine.SpyObj<GetItemByIdService>;

  beforeEach(() => {
    getUserService = jasmine.createSpyObj<GetUserService>('GetUserService', [ 'getForId' ]);
    getItemByIdService = jasmine.createSpyObj<GetItemByIdService>('GetItemByIdService', [ 'get' ]);

    TestBed.configureTestingModule({
      providers: [
        EntityResolutionCacheService,
        { provide: GetUserService, useValue: getUserService },
        { provide: GetItemByIdService, useValue: getItemByIdService },
        { provide: UserSessionService, useValue: { userProfile$: of(mockCurrentUser) } },
      ],
    });

    service = TestBed.inject(EntityResolutionCacheService);
  });

  describe('resolveUser', () => {
    it('should fetch and format a remote user', (done: DoneFn) => {
      getUserService.getForId.and.returnValue(of(mockUser({ login: 'alice', firstName: 'Alice', lastName: 'Smith' })));

      service.resolveUser('user-1').subscribe(name => {
        expect(name).toBe('Alice Smith (alice)');
        expect(getUserService.getForId).toHaveBeenCalledOnceWith('user-1');
        done();
      });
    });

    it('should return current user without HTTP call', (done: DoneFn) => {
      service.resolveUser('current-user-id').subscribe(name => {
        expect(name).toBe('Current User (currentLogin)');
        expect(getUserService.getForId).not.toHaveBeenCalled();
        done();
      });
    });

    it('should cache and reuse the same observable (no duplicate HTTP)', (done: DoneFn) => {
      getUserService.getForId.and.returnValue(of(mockUser({ login: 'bob' })));

      const obs1 = service.resolveUser('user-2');
      const obs2 = service.resolveUser('user-2');

      expect(obs1).toBe(obs2);
      obs2.subscribe(() => {
        expect(getUserService.getForId).toHaveBeenCalledTimes(1);
        done();
      });
    });

    it('should cache null on error (no retry)', (done: DoneFn) => {
      getUserService.getForId.and.returnValue(throwError(() => new Error('403')));

      service.resolveUser('invisible').subscribe(name => {
        expect(name).toBeNull();
        expect(getUserService.getForId).toHaveBeenCalledTimes(1);
        done();
      });
    });

    it('should reuse cached null without additional HTTP call', (done: DoneFn) => {
      getUserService.getForId.and.returnValue(throwError(() => new Error('403')));

      service.resolveUser('invisible').subscribe(() => {
        // first call triggers HTTP, second reuses cache
      });

      service.resolveUser('invisible').subscribe(name2 => {
        expect(name2).toBeNull();
        expect(getUserService.getForId).toHaveBeenCalledTimes(1);
        done();
      });
    });
  });

  describe('resolveItem', () => {
    it('should fetch and return item title', (done: DoneFn) => {
      getItemByIdService.get.and.returnValue(of(mockItem('Algebra 101')));

      service.resolveItem('item-1').subscribe(title => {
        expect(title).toBe('Algebra 101');
        expect(getItemByIdService.get).toHaveBeenCalledOnceWith('item-1');
        done();
      });
    });

    it('should cache and reuse item observables', (done: DoneFn) => {
      getItemByIdService.get.and.returnValue(of(mockItem('Cached')));

      const obs1 = service.resolveItem('item-2');
      const obs2 = service.resolveItem('item-2');

      expect(obs1).toBe(obs2);
      obs2.subscribe(() => {
        expect(getItemByIdService.get).toHaveBeenCalledTimes(1);
        done();
      });
    });

    it('should cache null on error', (done: DoneFn) => {
      getItemByIdService.get.and.returnValue(throwError(() => new Error('404')));

      service.resolveItem('hidden').subscribe(title => {
        expect(title).toBeNull();
        expect(getItemByIdService.get).toHaveBeenCalledTimes(1);
        done();
      });
    });
  });

  describe('prefetch', () => {
    it('should trigger resolution for all provided IDs', () => {
      getUserService.getForId.and.returnValue(of(mockUser()));
      getItemByIdService.get.and.returnValue(of(mockItem('X')));

      service.prefetch([ 'u1', 'u2' ], [ 'i1' ]);

      expect(getUserService.getForId).toHaveBeenCalledTimes(2);
      expect(getItemByIdService.get).toHaveBeenCalledTimes(1);
    });

    it('should not duplicate HTTP calls for already-cached IDs', () => {
      getUserService.getForId.and.returnValue(of(mockUser()));
      getItemByIdService.get.and.returnValue(of(mockItem('Y')));

      service.prefetch([ 'u1' ], [ 'i1' ]);
      service.prefetch([ 'u1' ], [ 'i1' ]);

      expect(getUserService.getForId).toHaveBeenCalledTimes(1);
      expect(getItemByIdService.get).toHaveBeenCalledTimes(1);
    });
  });
});
