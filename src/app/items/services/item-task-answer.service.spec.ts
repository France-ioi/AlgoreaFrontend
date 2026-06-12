import { TestBed } from '@angular/core/testing';
import { of } from 'rxjs';
import { provideMockStore } from '@ngrx/store/testing';
import { ItemTaskAnswerService } from './item-task-answer.service';
import { ItemTaskInitService } from './item-task-init.service';
import { CurrentAnswerService } from '../data-access/current-answer.service';
import { AnswerTokenService } from '../data-access/answer-token.service';
import { GradeService } from '../data-access/grade.service';
import { Task } from '../api/task-proxy';
import { itemRoute } from 'src/app/models/routing/item-route';
import { fromItemContent } from '../store';

const route = itemRoute('activity', '1', { attemptId: '0', path: [] });

function createMockTask(): jasmine.SpyObj<Task> {
  const task = jasmine.createSpyObj<Task>('Task', [ 'getAnswer', 'getState', 'gradeAnswer', 'reloadAnswer', 'reloadState' ]);
  task.getAnswer.and.returnValue(of('100'));
  task.getState.and.returnValue(of('task-state'));
  task.gradeAnswer.and.returnValue(of({ score: 100, message: 'ok', scoreToken: null }));
  return task;
}

interface SetupOptions {
  validated?: boolean, // value returned by save-grade
  alreadyValidated?: boolean, // current result validation state before submitting
}

function setup(options: SetupOptions = {}): { service: ItemTaskAnswerService, refreshToken: jasmine.Spy } {
  const mockTask = createMockTask();
  const refreshToken = jasmine.createSpy('refreshToken');

  const initServiceMock = {
    loadedTask$: of(mockTask),
    config$: of({ route, url: 'http://example.com/task', attemptId: '0', initialAnswer: null, readOnly: false }),
    taskToken$: of('task-token'),
    refreshToken,
  };

  TestBed.configureTestingModule({
    providers: [
      ItemTaskAnswerService,
      provideMockStore({
        selectors: [
          { selector: fromItemContent.selectActiveContentCurrentResult, value: { validated: options.alreadyValidated ?? false } },
        ],
      }),
      { provide: ItemTaskInitService, useValue: initServiceMock },
      { provide: CurrentAnswerService, useValue: { update: (): ReturnType<CurrentAnswerService['update']> => of(undefined) } },
      { provide: AnswerTokenService, useValue: { generate: (): ReturnType<AnswerTokenService['generate']> => of('answer-token') } },
      {
        provide: GradeService,
        useValue: {
          save: (): ReturnType<GradeService['save']> => of({ validated: options.validated ?? false, unlockedItems: [] }),
        },
      },
    ],
  });

  return { service: TestBed.inject(ItemTaskAnswerService), refreshToken };
}

describe('ItemTaskAnswerService – refresh token on validation', () => {
  afterEach(() => {
    TestBed.inject(ItemTaskAnswerService).ngOnDestroy();
  });

  it('refreshes the token when the submission newly validates the item', () => {
    const { service, refreshToken } = setup({ validated: true, alreadyValidated: false });

    service.submitAnswer().subscribe();

    expect(refreshToken).toHaveBeenCalled();
  });

  it('does NOT refresh the token when the item was already validated', () => {
    const { service, refreshToken } = setup({ validated: true, alreadyValidated: true });

    service.submitAnswer().subscribe();

    expect(refreshToken).not.toHaveBeenCalled();
  });

  it('does NOT refresh the token when the submission does not validate the item', () => {
    const { service, refreshToken } = setup({ validated: false, alreadyValidated: false });

    service.submitAnswer().subscribe();

    expect(refreshToken).not.toHaveBeenCalled();
  });
});
