import { build, ChannelConfiguration, MessageTransaction, MessagingChannel } from "jschannel";

export interface RxMessage<S, T> {
  method: string;
  success?: ((result: T) => void);
  params?: S;
  timeout?: number;
  error?: (error: any, message: string) => void;
}

export type CompleteFunction<T> = (result? : T) => void;
export type ErrorFunction = (...params : any) => void;

/** Build a RxMessagingChannel, which is  */
export function rxBuild(config: ChannelConfiguration): RxMessagingChannel {
  return new RxMessagingChannel(build(config));
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

  call<S, T>(message: RxMessage<S, T>): void {
    this.innerChan.call(message);
  }

  notify<S>(message: RxMessage<S, undefined>): void{
    this.innerChan.notify(message);
  }

  destroy(): void{
    this.innerChan.destroy();
  }
}
