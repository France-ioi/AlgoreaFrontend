import { build, ChannelConfiguration, MessageTransaction, MessagingChannel } from 'jschannel';
import { isObservable, Observable } from 'rxjs';
import { take } from 'rxjs/operators';
import { isString } from 'src/app/shared/helpers/type-checkers';

export interface RxMessage {
  method: string,
  params?: unknown,
  timeout?: number,
  error?: (error: unknown, message: string) => void,
}

class JsChannelError extends Error {
  constructor(error: unknown, message: string) {
    super(message);
    if (isString(error)) this.name = error;
    else {
      this.name = 'JSChannelError';
      this.message = `${this.message} (${JSON.stringify(error)})`;
    }
  }
}

/** Build a RxMessagingChannel, which is a jschannel with rxjs calls */
export function rxBuild(config: Omit<ChannelConfiguration, 'onReady'>): Observable<RxMessagingChannel> {
  return new Observable<RxMessagingChannel>(subscriber => {
    const channel = new RxMessagingChannel(build({
      ...config,
      onReady: (): void => {
        subscriber.next(channel);
        subscriber.complete();
      },
    }));
  });
}

export class RxMessagingChannel {
  private destroyed = false;

  constructor(private channel: MessagingChannel) {}

  unbind(method: string, doNotPublish?: boolean): boolean {
    if (this.destroyed) return true;
    return this.channel.unbind(method, doNotPublish);
  }

  /** Bind a local method, allowing the remote task to call it */
  bind<T extends Observable<any> | any>(method: string, mapper?: (params: unknown) => T, doNotPublish?: boolean): MessagingChannel {
    // Create a callback wrapping the observable bound
    const callback = (transaction: MessageTransaction, params: unknown): void => {
      if (!mapper || this.destroyed) return;

      const forwardError = (error: unknown): void => {
        if (!this.destroyed) transaction.error(error, error instanceof Error ? error.toString() : '');
      };
      try {
        const result = mapper(params);
        if (!isObservable(result)) return transaction.complete(result);

        transaction.delayReturn(true);

        // This class is intended to be used with functions returning finite observables, either resolving or failing.
        result
          .pipe(take(1))
          .subscribe({
            next: data => {
              // If the channel is destroyed before an observable completes, let it the observable finish since it might be
              // an xhr request saving data, and avoid notifying the channel since it's been destroyed
              if (!this.destroyed) transaction.complete(data);
            },
            error: forwardError,
          });
      } catch (error) {
        forwardError(error);
      }
    };
    return this.channel.bind(method, callback, doNotPublish);
  }

  /** Call a remote method through jschannel, return the result through an Observable */
  call(message: RxMessage): Observable<unknown[]> {
    // Create an Observable wrapping the inner jschannel call
    return new Observable<unknown[]>(subscriber => {
      if (this.destroyed) return;
      const innerMessage = {
        ...message,
        success: (...results: unknown[]): void => {
          subscriber.next(results);
          subscriber.complete();
        },
        error: (error: any, errorMessage: string): void => subscriber.error(new JsChannelError(error, errorMessage))
      };
      this.channel.call(innerMessage);
    });
  }

  notify(message: RxMessage): void {
    if (this.destroyed) return;
    this.channel.notify(message);
  }

  destroy(): void {
    this.destroyed = true;
    this.channel.destroy();
  }
}
