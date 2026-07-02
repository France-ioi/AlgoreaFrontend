import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideMockStore } from '@ngrx/store/testing';
import { of } from 'rxjs';
import { CurrentUserProfile } from 'src/app/data-access/current-user.service';
import { UserResolutionCacheService } from 'src/app/groups/data-access/user-resolution-cache.service';
import { formatUser, User } from 'src/app/groups/models/user';
import { UserSessionService } from 'src/app/services/user-session.service';
import { messageEvent, submissionEvent } from '../../models/thread-events';
import { ThreadId } from '../../models/threads';
import { ThreadMessageComponent } from './thread-message.component';

const threadId: ThreadId = { itemId: 'item-1', participantId: 'participant-1' };

function mockUser(login: string, groupId: string): User {
  return { login, groupId, firstName: 'First', lastName: 'Last' } as User;
}

function mockCurrentUser(groupId: string): CurrentUserProfile {
  return {
    groupId,
    login: 'current',
    profile: { firstName: 'Current', lastName: 'User' },
    defaultLanguage: 'en',
    tempUser: false,
  };
}

interface SetupOptions {
  currentUserGroupId?: string,
  resolveUserImpl?: (id: string) => User | null,
}

interface SetupResult {
  fixture: ComponentFixture<ThreadMessageComponent>,
  component: ThreadMessageComponent,
  userCache: jasmine.SpyObj<UserResolutionCacheService>,
}

function setup(options: SetupOptions = {}): SetupResult {
  const userCache = jasmine.createSpyObj<UserResolutionCacheService>('UserResolutionCacheService', [ 'resolveUser' ]);
  userCache.resolveUser.and.callFake((id: string) => {
    const user = options.resolveUserImpl ? options.resolveUserImpl(id) : mockUser(`user-${ id }`, id);
    return of(user);
  });

  TestBed.configureTestingModule({
    imports: [ ThreadMessageComponent ],
    providers: [
      provideMockStore(),
      { provide: UserSessionService, useValue: { userProfile$: of(mockCurrentUser(options.currentUserGroupId ?? 'helper-1')) } },
      { provide: UserResolutionCacheService, useValue: userCache },
    ],
  });

  const fixture = TestBed.createComponent(ThreadMessageComponent);
  const component = fixture.componentInstance;

  return { fixture, component, userCache };
}

describe('ThreadMessageComponent', () => {
  it('should resolve message author name via resolveUser and formatUser', () => {
    const { fixture, component, userCache } = setup();
    const authorId = 'author-1';

    fixture.componentRef.setInput('threadId', threadId);
    fixture.componentRef.setInput('event', messageEvent({
      time: new Date(),
      authorId,
      text: 'hello',
      uuid: 'uuid-1',
    }));
    fixture.detectChanges();

    expect(component.userInfo().name).toBe(formatUser(mockUser('user-author-1', authorId)));
    expect(userCache.resolveUser).toHaveBeenCalledWith(authorId);
  });

  it('should set isCurrentUser when subject id equals current user group id', () => {
    const authorId = 'author-1';
    const { fixture, component, userCache } = setup({ currentUserGroupId: authorId });

    fixture.componentRef.setInput('threadId', threadId);
    fixture.componentRef.setInput('event', messageEvent({
      time: new Date(),
      authorId,
      text: 'hello',
      uuid: 'uuid-1',
    }));
    fixture.detectChanges();

    expect(component.userInfo().isCurrentUser).toBeTrue();
    expect(component.userInfo().name).toBeUndefined();
    expect(userCache.resolveUser).not.toHaveBeenCalled();
  });

  it('should set isThreadParticipant when subject id equals threadId.participantId', () => {
    const { fixture, component } = setup();

    fixture.componentRef.setInput('threadId', threadId);
    fixture.componentRef.setInput('event', submissionEvent({
      time: new Date(),
      attemptId: 'attempt-1',
      answerId: 'answer-1',
    }));
    fixture.detectChanges();

    expect(component.userInfo().isThreadParticipant).toBeTrue();
    expect(component.userInfo().id).toBe(threadId.participantId);
  });

  it('should leave name undefined when resolveUser returns null', () => {
    const { fixture, component, userCache } = setup({ resolveUserImpl: () => null });

    fixture.componentRef.setInput('threadId', threadId);
    fixture.componentRef.setInput('event', messageEvent({
      time: new Date(),
      authorId: 'unknown-author',
      text: 'hello',
      uuid: 'uuid-1',
    }));
    fixture.detectChanges();

    expect(component.userInfo().name).toBeUndefined();
    expect(userCache.resolveUser).toHaveBeenCalledWith('unknown-author');
  });
});
