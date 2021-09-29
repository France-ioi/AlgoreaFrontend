import { build, ChannelConfiguration, MessageTransaction, MessagingChannel } from 'jschannel';
import { Observable } from 'rxjs';
import { take } from 'rxjs/operators';

export interface RxMessage {
  method: string,
  params?: unknown,
  timeout?: number,
  error?: (error: unknown, message: string) => void,
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
  constructor(private channel: MessagingChannel) {}

  unbind(method: string, doNotPublish?: boolean): boolean {
    return this.channel.unbind(method, doNotPublish);
  }

  /** Bind a local method, allowing the remote task to call it */
  bind<T>(method: string, observable?: (params: unknown) => Observable<T>, doNotPublish?: boolean): MessagingChannel {
    // Create a callback wrapping the observable bound
    function callback(transaction: MessageTransaction, params: unknown): void {
      if (!observable) return;

      const cb$ = observable(params);
      cb$
        .pipe(take(1))
        .subscribe({
          next: transaction.complete,
          error: error => transaction.error(error, error instanceof Error ? error.toString() : '')
        });
      transaction.delayReturn(true);
    }
    return this.channel.bind(method, callback, doNotPublish);
  }

  /** Call a remote method through jschannel, return the result through an Observable */
  call(message: RxMessage): Observable<unknown[]> {
    // Create an Observable wrapping the inner jschannel call
    return new Observable<unknown[]>(subscriber => {

      const innerMessage = {
        ...message,
        success: (...results: unknown[]): void => {
          subscriber.next(results);
          subscriber.complete();
        },
        error: (error: any, _message: string): void => subscriber.error(error)
      };
      this.channel.call(innerMessage);
    });
  }

  notify(message: RxMessage): void {
    this.channel.notify(message);
  }

  destroy(): void{
    this.channel.destroy();
  }
}
