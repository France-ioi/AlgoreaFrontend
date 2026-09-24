import { TestBed } from '@angular/core/testing';
import { Subscription } from 'rxjs';
import { MessageService, MessageV2 } from './message.service';
import { SECONDS } from 'src/app/utils/duration';

describe('MessageService', () => {
  let service: MessageService;
  let closed: MessageV2[];
  let sub: Subscription;

  const msg = (overrides: Partial<MessageV2> = {}): MessageV2 => ({
    severity: 'info',
    detail: 'hello',
    ...overrides,
  });

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(MessageService);
    closed = [];
    sub = service.messageCloseEvent$.subscribe(m => closed.push(m));
  });

  afterEach(() => {
    sub.unsubscribe();
  });

  // jasmine.clock + mockDate: advances RxJS timer() and Date.now() for remaining-time pause.
  describe('auto-dismiss', () => {
    beforeEach(() => {
      jasmine.clock().install();
      jasmine.clock().mockDate();
    });

    afterEach(() => {
      jasmine.clock().uninstall();
    });

    it('emits after the default 5s life', () => {
      const message = msg();
      service.add(message);

      jasmine.clock().tick(5 * SECONDS - 1);
      expect(closed).toEqual([]);

      jasmine.clock().tick(1);
      expect(closed).toEqual([ message ]);
    });

    it('emits after a custom life', () => {
      const message = msg({ life: 2 * SECONDS });
      service.add(message);

      jasmine.clock().tick(2 * SECONDS - 1);
      expect(closed).toEqual([]);

      jasmine.clock().tick(1);
      expect(closed).toEqual([ message ]);
    });

    it('treats life 0 as the default duration', () => {
      const message = msg({ life: 0 });
      service.add(message);

      jasmine.clock().tick(5 * SECONDS - 1);
      expect(closed).toEqual([]);

      jasmine.clock().tick(1);
      expect(closed).toEqual([ message ]);
    });

    it('does not emit while held', () => {
      const message = msg({ life: 2 * SECONDS });
      service.add(message);

      jasmine.clock().tick(SECONDS);
      service.setAutoDismissHeld(message, true);
      jasmine.clock().tick(10 * SECONDS);

      expect(closed).toEqual([]);
    });

    it('resumes with remaining time after hold is released', () => {
      const message = msg({ life: 3 * SECONDS });
      service.add(message);

      jasmine.clock().tick(2 * SECONDS);
      service.setAutoDismissHeld(message, true);
      jasmine.clock().tick(5 * SECONDS);
      service.setAutoDismissHeld(message, false);

      jasmine.clock().tick(SECONDS - 1);
      expect(closed).toEqual([]);

      jasmine.clock().tick(1);
      expect(closed).toEqual([ message ]);
    });

    it('tracks independent timers per message', () => {
      const first = msg({ detail: 'first', life: 2 * SECONDS });
      const second = msg({ detail: 'second', life: 4 * SECONDS });
      service.add(first);
      service.add(second);

      jasmine.clock().tick(2 * SECONDS);
      expect(closed).toEqual([ first ]);

      jasmine.clock().tick(2 * SECONDS);
      expect(closed).toEqual([ first, second ]);
    });

    it('cancels a paused timer when the message is dismissed', () => {
      const message = msg({ life: 3 * SECONDS });
      service.add(message);

      jasmine.clock().tick(SECONDS);
      service.setAutoDismissHeld(message, true);
      service.dismiss(message);
      service.setAutoDismissHeld(message, false);
      jasmine.clock().tick(10 * SECONDS);

      expect(closed).toEqual([]);
    });

    it('cancels a paused timer when clear is called', () => {
      const message = msg({ life: 3 * SECONDS });
      service.add(message);

      jasmine.clock().tick(SECONDS);
      service.setAutoDismissHeld(message, true);
      service.clear();
      jasmine.clock().tick(10 * SECONDS);

      expect(closed).toEqual([]);
    });

    it('ignores setAutoDismissHeld for a message that is already gone', () => {
      const message = msg({ life: SECONDS });
      service.add(message);
      service.dismiss(message);

      expect(() => service.setAutoDismissHeld(message, true)).not.toThrow();
      jasmine.clock().tick(10 * SECONDS);
      expect(closed).toEqual([]);
    });
  });
});
