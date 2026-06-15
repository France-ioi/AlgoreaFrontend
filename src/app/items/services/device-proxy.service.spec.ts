import { TestBed } from '@angular/core/testing';
import { of, throwError } from 'rxjs';
import { Task } from '../api/task-proxy';
import { DeviceProxyService } from './device-proxy.service';

describe('DeviceProxyService', () => {
  let service: DeviceProxyService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(DeviceProxyService);
    delete window.DeviceProxyPlatform;
    delete window.task;
  });

  afterEach(() => {
    delete window.DeviceProxyPlatform;
    delete window.task;
  });

  it('handle emits the platform callback result when the UMD global is already loaded', done => {
    window.DeviceProxyPlatform = {
      deviceProxy: (_category, _method, _args, callback) => callback({ ok: true }),
      cleanup: () => {},
    };

    service.handle('websocket', 'open', [ 'ws://example.test' ]).subscribe({
      next: result => {
        expect(result).toEqual({ ok: true });
        done();
      },
      error: done.fail,
    });
  });

  it('handle propagates platform errorCallback failures', done => {
    window.DeviceProxyPlatform = {
      deviceProxy: (_category, _method, _args, _callback, errorCallback) => {
        errorCallback({ message: 'proxy failed' });
      },
      cleanup: () => {},
    };

    service.handle('bluetooth', 'requestDevice', [ { filters: [] } ]).subscribe({
      next: () => done.fail('expected error'),
      error: error => {
        expect(error).toEqual({ message: 'proxy failed' });
        done();
      },
    });
  });

  it('connectTask forwards window.task.deviceProxy to Task.deviceProxy', () => {
    const task = jasmine.createSpyObj<Task>('Task', [ 'deviceProxy' ]);
    task.deviceProxy.and.returnValue(of({ routed: true }));

    service.connectTask(task);
    const success = jasmine.createSpy('success');
    window.task?.deviceProxy('websocket', 'event', { name: 'close' }, success, () => {});

    expect(task.deviceProxy).toHaveBeenCalledWith('websocket', 'event', { name: 'close' });
    expect(success).toHaveBeenCalledWith({ routed: true });
  });

  it('disconnectTask cleans up and leaves a swallow stub for late async events', () => {
    const cleanup = jasmine.createSpy('cleanup');
    window.DeviceProxyPlatform = { deviceProxy: () => {}, cleanup };

    service.disconnectTask();

    expect(cleanup).toHaveBeenCalled();
    expect(() => window.task?.deviceProxy('websocket', 'event', {}, () => {}, () => {})).not.toThrow();
  });

  it('disconnectTask is a no-op cleanup when the UMD global was never loaded', () => {
    service.disconnectTask();
    expect(() => window.task?.deviceProxy('websocket', 'event', {}, () => {}, () => {})).not.toThrow();
  });

  it('connectTask after disconnectTask installs a fresh bridge', () => {
    const task = jasmine.createSpyObj<Task>('Task', [ 'deviceProxy' ]);
    task.deviceProxy.and.returnValue(throwError(() => new Error('channel gone')));

    service.disconnectTask();
    service.connectTask(task);

    expect(() => window.task?.deviceProxy('bluetooth', 'event', {}, () => {}, () => {})).not.toThrow();
    expect(task.deviceProxy).toHaveBeenCalled();
  });
});
