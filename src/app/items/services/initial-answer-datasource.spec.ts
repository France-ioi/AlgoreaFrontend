import { TestBed } from '@angular/core/testing';
import { provideMockStore } from '@ngrx/store/testing';
import { of } from 'rxjs';
import { InitialAnswerDataSource } from './initial-answer-datasource';
import { CurrentAnswerService } from '../data-access/current-answer.service';
import { GetAnswerService } from '../data-access/get-answer.service';
import { AnswerService } from '../data-access/answer.service';
import { fromObservation } from 'src/app/store/observation';
import { itemRoute } from 'src/app/models/routing/item-route';
import { Answer } from './item-task.service';

const route = itemRoute('activity', '1', { attemptId: '0', path: [] });

const currentAnswer = {
  id: 'cur-1',
  answer: 'wip',
  state: 'wip-state',
  attemptId: '0',
  authorId: '1',
  participantId: '1',
  itemId: '1',
  score: null,
  type: 'Current' as const,
};

const submission: Answer = {
  id: 'sub-1',
  answer: '80',
  state: 'sub-state',
  authorId: '1',
  participantId: '1',
  itemId: '1',
  score: 80,
  type: 'Submission',
};

describe('InitialAnswerDataSource – saves editor history', () => {
  let datasource: InitialAnswerDataSource;
  let currentAnswerGet: jasmine.Spy;
  let currentAnswerUpdate: jasmine.Spy;
  let answerSave: jasmine.Spy;
  let getAnswer: jasmine.Spy;

  beforeEach(() => {
    currentAnswerGet = jasmine.createSpy('get').and.returnValue(of(currentAnswer));
    currentAnswerUpdate = jasmine.createSpy('update').and.returnValue(of(undefined));
    answerSave = jasmine.createSpy('save').and.returnValue(of(undefined));
    getAnswer = jasmine.createSpy('get').and.returnValue(of(submission));

    TestBed.configureTestingModule({
      providers: [
        InitialAnswerDataSource,
        provideMockStore({
          selectors: [ { selector: fromObservation.selectIsObserving, value: false } ],
        }),
        { provide: CurrentAnswerService, useValue: { get: currentAnswerGet, update: currentAnswerUpdate } },
        { provide: GetAnswerService, useValue: { get: getAnswer, getBest: jasmine.createSpy('getBest') } },
        { provide: AnswerService, useValue: { save: answerSave } },
      ],
    });

    datasource = TestBed.inject(InitialAnswerDataSource);
  });

  afterEach(() => {
    datasource.ngOnDestroy();
  });

  it('does not load a platform current answer when the task saves editor history', () => {
    const emitted: (Answer | null | undefined)[] = [];
    datasource.answer$.subscribe(value => emitted.push(value));

    datasource.setInfo(route, true);
    expect(emitted).toEqual([ undefined ]);
    expect(currentAnswerGet).not.toHaveBeenCalled();

    datasource.setSavesEditorHistory(true);
    expect(emitted).toEqual([ undefined, null ]);
    expect(currentAnswerGet).not.toHaveBeenCalled();
  });

  it('loads the platform current answer when the task does not save editor history', () => {
    const emitted: (Answer | null | undefined)[] = [];
    datasource.answer$.subscribe(value => emitted.push(value));

    datasource.setInfo(route, true);
    datasource.setSavesEditorHistory(false);

    expect(currentAnswerGet).toHaveBeenCalledWith('1', '0');
    expect(emitted.at(-1)).toEqual(jasmine.objectContaining({ id: 'cur-1', type: 'Current' }));
  });

  it('loads a submission for Edit it without backing up WIP when the task saves editor history', () => {
    spyOnProperty(history, 'state', 'get').and.returnValue({ loadAnswerIdAsCurrent: 'sub-1' });

    const emitted: (Answer | null | undefined)[] = [];
    datasource.answer$.subscribe(value => emitted.push(value));

    datasource.setInfo(route, true);
    datasource.setSavesEditorHistory(true);

    expect(getAnswer).toHaveBeenCalledWith('sub-1');
    expect(answerSave).not.toHaveBeenCalled();
    expect(currentAnswerUpdate).not.toHaveBeenCalled();
    expect(emitted.at(-1)).toEqual(jasmine.objectContaining({ id: 'sub-1', type: 'Submission' }));
  });

  it('backs up WIP when Edit it runs and the task does not save editor history', () => {
    spyOnProperty(history, 'state', 'get').and.returnValue({ loadAnswerIdAsCurrent: 'sub-1' });

    const emitted: (Answer | null | undefined)[] = [];
    datasource.answer$.subscribe(value => emitted.push(value));

    datasource.setInfo(route, true);
    datasource.setSavesEditorHistory(false);

    expect(answerSave).toHaveBeenCalledWith('1', '0', { answer: 'wip', state: 'wip-state' });
    expect(currentAnswerUpdate).toHaveBeenCalled();
    expect(emitted.at(-1)).toEqual(jasmine.objectContaining({ id: 'sub-1' }));
  });
});
