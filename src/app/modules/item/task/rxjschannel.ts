import { build, ChannelConfiguration, MessageTransaction, MessagingChannel } from "jschannel";
import { Observable } from "rxjs";
import * as D from 'io-ts/Decoder';
import { pipe as fppipe } from 'fp-ts/function';
import { fold } from "fp-ts/lib/Either";


export interface RxMessage<T> {
  method: string;
  params?: T;
  timeout?: number;
  error?: (error: any, message: string) => void;
}

/** Build a RxMessagingChannel, which is a jschannel with rxjs calls */
export function rxBuild(config: ChannelConfiguration): Observable<RxMessagingChannel> {
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
  bind<T>(method: string, observable?: (params: T) => Observable<any>, validator?: D.Decoder<unknown, T>,
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
      cb$.subscribe({
        next: transaction.complete,
        error: error => transaction.error(error, '')
      });
      transaction.delayReturn(true);
    }
    return this.innerChan.bind(method, callback, doNotPublish);
  }

  /** Call a remote method through jschannel, return the result through an Observable */
  call<S, T>(message: RxMessage<S>, validator?: D.Decoder<unknown, T>): Observable<T> {
    // Create an Observable wrapping the inner jschannel call
    return new Observable<T>(subscriber => {
      const innerMessage = {
        ...message,
        success: (result?: any): void => {
          // Validate result before passing it, if there is a validator
          const decodedResult = validator
            ? fppipe(
              validator.decode(result),
              fold(
                error => {
                  throw new Error(D.draw(error));
                },
                decoded => decoded
              ))
            : result as T;

          subscriber.next(decodedResult);
          subscriber.complete();
        },
        error: (error: any, _message: string): void => subscriber.error(error)
      };
      this.innerChan.call(innerMessage);
    });
  }

  notify<T>(message: RxMessage<T>): void {
    this.innerChan.notify(message);
  }

  destroy(): void{
    this.innerChan.destroy();
  }
}
