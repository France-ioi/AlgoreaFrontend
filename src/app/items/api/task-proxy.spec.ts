import { of } from 'rxjs';
import {
  negotiateApiVersion,
  PLATFORM_MAX_API_VERSION,
  PLATFORM_MIN_API_VERSION,
  savesEditorHistory,
} from './task-api-version';
import { Task } from './task-proxy';
import { RxMessagingChannel } from './rxjschannel';
import { TaskHistoryElement } from './types';

const sampleHistoryElement: TaskHistoryElement = {
  id: 2,
  datetime: '2024-01-01T12:00:00Z',
  tags: [{ identifier: 'manual', i18nText: 'Manual' }],
  idUser: 'u1',
  isCheckpoint: true,
  sinceEarlier: { charsAdded: 4, charsRemoved: 1 },
  sinceEarlierCheckpoint: { charsAdded: 10, charsRemoved: 2, elementsCount: 1 },
  activeTab: { name: 'main.py', length: 40, progLang: 'python' },
};

describe('negotiateApiVersion', () => {
  it('should default to version 1 when metadata omits apiVersion fields', () => {
    expect(negotiateApiVersion()).toBe(1);
  });

  it('should pick the highest version in the overlapping range', () => {
    expect(negotiateApiVersion(1, 2)).toBe(2);
  });

  it('should cap at the platform max supported version', () => {
    expect(negotiateApiVersion(1, 99)).toBe(PLATFORM_MAX_API_VERSION);
  });

  it('should floor at the platform min supported version', () => {
    expect(negotiateApiVersion(0, 1)).toBe(PLATFORM_MIN_API_VERSION);
  });

  it('should return null when there is no overlapping version range', () => {
    expect(negotiateApiVersion(99, 99)).toBeNull();
    expect(negotiateApiVersion(PLATFORM_MAX_API_VERSION + 1, PLATFORM_MAX_API_VERSION + 5)).toBeNull();
  });

  it('should accept a task that only supports version 1', () => {
    expect(negotiateApiVersion(1, 1)).toBe(PLATFORM_MIN_API_VERSION);
  });

  it('should negotiate version 3 when the task supports it', () => {
    expect(negotiateApiVersion(1, 3)).toBe(3);
    expect(PLATFORM_MAX_API_VERSION).toBe(3);
  });
});

describe('savesEditorHistory', () => {
  it('should be true only when negotiated version is at least 3 and savesHistory is true', () => {
    expect(savesEditorHistory(3, true)).toBe(true);
    expect(savesEditorHistory(3, false)).toBe(false);
    expect(savesEditorHistory(3, undefined)).toBe(false);
    expect(savesEditorHistory(2, true)).toBe(false);
    expect(savesEditorHistory(1, true)).toBe(false);
  });
});

describe('Task.getHistory', () => {
  function createTask(apiVersion: number, history: unknown = [ sampleHistoryElement ]): Task {
    const chan = {
      call: jasmine.createSpy('call').and.returnValue(of([ history ])),
      destroy: jasmine.createSpy('destroy'),
      bind: jasmine.createSpy('bind'),
      unbind: jasmine.createSpy('unbind'),
    } as unknown as RxMessagingChannel;
    const task = new Task(chan);
    task.apiVersion = apiVersion;
    return task;
  }

  it('should call task.getHistory and validate the result when apiVersion is ≥ 3', done => {
    const task = createTask(3);
    task.getHistory({ onlyCheckpoints: true, limit: 50 }).subscribe({
      next: history => {
        expect(history).toEqual([ sampleHistoryElement ]);
        done();
      },
      error: done.fail,
    });
  });

  it('should reject when apiVersion is below 3', done => {
    const task = createTask(2);
    task.getHistory().subscribe({
      next: () => done.fail('expected error'),
      error: err => {
        expect((err as Error).message).toContain('API version');
        done();
      },
    });
  });

  it('should fail when the task returns an invalid history payload', done => {
    const task = createTask(3, [{ id: 'not-a-number' }]);
    task.getHistory().subscribe({
      next: () => done.fail('expected validation error'),
      error: err => {
        expect(err).toBeTruthy();
        done();
      },
    });
  });
});
