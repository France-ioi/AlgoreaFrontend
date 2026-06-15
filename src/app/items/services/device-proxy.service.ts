import { Injectable } from '@angular/core';
import { from, Observable, switchMap } from 'rxjs';
import {
  cleanupDeviceProxy,
  ensureDeviceProxyPlatformLoaded,
  handleDeviceProxy,
  swallowDeviceProxyEvents,
} from '../api/device-proxy-platform';
import { Task } from '../api/task-proxy';

/**
 * Root singleton bridging bebras-device-proxy to the active task iframe.
 *
 * **Constraint: at most one task iframe may use the device proxy at a time.** The underlying
 * module keeps global connection state and reads `window.task` for event pushes. The app
 * currently mounts a single `alg-item-display` per item view; mounting two task iframes
 * simultaneously (e.g. split comparison) is unsupported and would mis-route events.
 */
@Injectable({ providedIn: 'root' })
export class DeviceProxyService {
  handle(category: string, method: string, args: unknown[]): Observable<unknown> {
    return from(ensureDeviceProxyPlatformLoaded()).pipe(
      switchMap(() => new Observable<unknown>(subscriber => {
        handleDeviceProxy(
          category,
          method,
          args,
          (result: unknown) => {
            subscriber.next(result);
            subscriber.complete();
          },
          (error: unknown) => subscriber.error(error),
        );
      })),
    );
  }

  connectTask(task: Task): void {
    window.task = {
      deviceProxy: (category, method, args, success, error): void => {
        task.deviceProxy(category, method, args).subscribe({ next: success, error });
      },
    };
  }

  disconnectTask(): void {
    cleanupDeviceProxy();
    // Leave a swallow stub: cleanup() closes WebSockets asynchronously and the module may
    // still push events via window.task.deviceProxy after this call returns.
    swallowDeviceProxyEvents();
  }
}
