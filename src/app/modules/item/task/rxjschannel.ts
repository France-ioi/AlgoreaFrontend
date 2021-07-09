import { build, ChannelConfiguration, MessageTransaction, MessagingChannel } from "jschannel";
import { Observable } from "rxjs";

export interface RxMessage<T> {
  method: string;
  params?: T;
  timeout?: number;
  error?: (error: any, message: string) => void;
}

export type CompleteFunction<T> = (result? : T) => void;
export type ErrorFunction = (...params : any) => void;

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

  bind<T>(method: string, callback?: (transaction: MessageTransaction, params: T) => void, doNotPublish?: boolean): MessagingChannel {
    return this.innerChan.bind(method, callback, doNotPublish);
  }

  call<S, T>(message: RxMessage<S>, validator?: (result?: any) => T): Observable<T> {
    // Create an Observable wrapping the inner jschannel call
    return new Observable<T>(subscriber => {
      const innerMessage = {
        ...message,
        success: (result?: any): void => {
          subscriber.next(validator ? validator(result) : result as T);
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
