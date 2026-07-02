import { TestBed } from '@angular/core/testing';
import { of, throwError } from 'rxjs';
import { User } from '../models/user';
import { GetUserService } from './get-user.service';
import { UserResolutionCacheService } from './user-resolution-cache.service';

function mockUser(login: string): User {
  return { login, groupId: 'group-1' } as User;
}

describe('UserResolutionCacheService', () => {
  let service: UserResolutionCacheService;
  let getUserService: jasmine.SpyObj<GetUserService>;

  beforeEach(() => {
    getUserService = jasmine.createSpyObj<GetUserService>('GetUserService', [ 'getForId' ]);

    TestBed.configureTestingModule({
      providers: [
        UserResolutionCacheService,
        { provide: GetUserService, useValue: getUserService },
      ],
    });

    service = TestBed.inject(UserResolutionCacheService);
  });

  describe('resolveUser', () => {
    it('should fetch and return user', (done: DoneFn) => {
      getUserService.getForId.and.returnValue(of(mockUser('alice')));

      service.resolveUser('user-1').subscribe(user => {
        expect(user?.login).toBe('alice');
        expect(getUserService.getForId).toHaveBeenCalledOnceWith('user-1');
        done();
      });
    });

    it('should cache and reuse user observables', (done: DoneFn) => {
      getUserService.getForId.and.returnValue(of(mockUser('bob')));

      const obs1 = service.resolveUser('user-2');
      const obs2 = service.resolveUser('user-2');

      expect(obs1).toBe(obs2);
      obs2.subscribe(() => {
        expect(getUserService.getForId).toHaveBeenCalledTimes(1);
        done();
      });
    });

    it('should cache null on error', (done: DoneFn) => {
      getUserService.getForId.and.returnValue(throwError(() => new Error('404')));

      service.resolveUser('hidden').subscribe(user => {
        expect(user).toBeNull();
        expect(getUserService.getForId).toHaveBeenCalledTimes(1);
        done();
      });
    });
  });

  describe('prefetchUsers', () => {
    it('should trigger resolution for all provided user IDs', () => {
      getUserService.getForId.and.returnValue(of(mockUser('X')));

      service.prefetchUsers([ 'u1', 'u2' ]);

      expect(getUserService.getForId).toHaveBeenCalledTimes(2);
    });

    it('should not duplicate HTTP calls for already-cached IDs', () => {
      getUserService.getForId.and.returnValue(of(mockUser('Y')));

      service.prefetchUsers([ 'u1' ]);
      service.prefetchUsers([ 'u1' ]);

      expect(getUserService.getForId).toHaveBeenCalledTimes(1);
    });
  });
});
