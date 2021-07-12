import { build, ChannelConfiguration, MessageTransaction, MessagingChannel } from "jschannel";
import { Observable } from "rxjs";
import { take } from 'rxjs/operators';
import * as D from 'io-ts/Decoder';
import { pipe as fppipe } from 'fp-ts/function';
import { fold } from "fp-ts/lib/Either";


export interface RxMessage {
  method: string;
  params?: unknown;
  timeout?: number;
  selector?: (...result: any[]) => unknown;
  error?: (error: any, message: string) => void;
}

/** Build a RxMessagingChannel, which is a jschannel with rxjs calls */
export function rxBuild(config: Omit<ChannelConfiguration, 'onReady'>): Observable<RxMessagingChannel> {
  return new Observable<RxMessagingChannel>(subscriber => {
    let chan : RxMessagingChannel | null = null;
    const innerConfig = {
      onReady: () : void => {
        subscriber.next(chan as RxMessagingChannel);
        subscriber.complete();
      },
      ...config
    };
    chan = new RxMessagingChannel(build(innerConfig));
  });
}

export class RxMessagingChannel {
  innerChan: MessagingChannel;

  constructor(innerChan: MessagingChannel) {
    this.innerChan = innerChan;
  }

  unbind(method: string, doNotPublish?: boolean): boolean {
    return this.innerChan.unbind(method, doNotPublish);
  }

  /** Bind a local method, allowing the remote task to call it */
  bind<T>(method: string, observable?: (params: T) => Observable<unknown>, validator?: D.Decoder<unknown, T>,
    doNotPublish?: boolean): MessagingChannel {
    // Create a callback wrapping the observable bound
    function callback(transaction: MessageTransaction, params: unknown): void {
      if (!observable) {
        return;
      }
      // Validate params before passing them, if there is a validator
      const decodedParams = validator
        ? fppipe(
          validator.decode(params),
          fold(
            error => {
              transaction.error(error, D.draw(error));
              // Also throw the error locally so we know something went wrong
              throw new Error(D.draw(error));
            },
            decoded => decoded
          ))
        : params as T;

      const cb$ = observable(decodedParams);
      cb$
        .pipe(take(1))
        .subscribe({
          next: transaction.complete,
          error: error => transaction.error(error, '')
        });
      transaction.delayReturn(true);
    }
    return this.innerChan.bind(method, callback, doNotPublish);
  }

  /** Call a remote method through jschannel, return the result through an Observable */
  call<T>(message: RxMessage, validator?: D.Decoder<unknown, T>): Observable<T> {
    // Create an Observable wrapping the inner jschannel call
    return new Observable<T>(subscriber => {
      const selector = message.selector
        ? message.selector
        : (...result: any[]) : unknown => (result.length > 0 && result[0]) || undefined;

      const innerMessage = {
        ...message,
        success: (...result: any[]): void => {
          // Validate result before passing it, if there is a validator
          const filteredResult = selector(result);
          const decodedResult = validator
            ? fppipe(
              validator.decode(filteredResult),
              fold(
                error => {
                  throw new Error(D.draw(error));
                },
                decoded => decoded
              ))
            : filteredResult as T;

          subscriber.next(decodedResult);
          subscriber.complete();
        },
        error: (error: any, _message: string): void => subscriber.error(error)
      };
      this.innerChan.call(innerMessage);
    });
  }

  notify(message: RxMessage): void {
    this.innerChan.notify(message);
  }

  destroy(): void{
    this.innerChan.destroy();
  }
}
