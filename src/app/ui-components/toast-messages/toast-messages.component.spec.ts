import { ComponentFixture, TestBed } from '@angular/core/testing';
import { By } from '@angular/platform-browser';
import { MessageService, MessageV2 } from 'src/app/services/message.service';
import { ToastMessagesComponent } from './toast-messages.component';

describe('ToastMessagesComponent', () => {
  let fixture: ComponentFixture<ToastMessagesComponent>;
  let messageService: MessageService;
  let setHeldSpy: jasmine.Spy;
  let message: MessageV2;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ ToastMessagesComponent ],
    }).compileComponents();

    messageService = TestBed.inject(MessageService);
    setHeldSpy = spyOn(messageService, 'setAutoDismissHeld').and.callThrough();
    message = { severity: 'info', detail: 'toast' };
    messageService.add(message);

    fixture = TestBed.createComponent(ToastMessagesComponent);
    fixture.detectChanges();
  });

  afterEach(() => {
    fixture.destroy();
  });

  function messageEl(): HTMLElement {
    return fixture.debugElement.query(By.css('.message')).nativeElement as HTMLElement;
  }

  function stubHoverSupport(supportsHover: boolean): void {
    spyOn(window, 'matchMedia').and.callFake((query: string) => ({
      matches: query === '(hover: hover)' ? supportsHover : false,
      media: query,
      onchange: null,
      addListener: (): void => undefined,
      removeListener: (): void => undefined,
      addEventListener: (): void => undefined,
      removeEventListener: (): void => undefined,
      dispatchEvent: (): boolean => false,
    }));
  }

  it('holds auto-dismiss on mouseenter when hover is supported', () => {
    stubHoverSupport(true);

    messageEl().dispatchEvent(new MouseEvent('mouseenter'));

    expect(setHeldSpy).toHaveBeenCalledWith(message, true);
  });

  it('does not hold on mouseenter when hover is unsupported', () => {
    stubHoverSupport(false);

    messageEl().dispatchEvent(new MouseEvent('mouseenter'));

    expect(setHeldSpy).not.toHaveBeenCalled();
  });

  it('holds auto-dismiss on focusin and releases on focusout outside the toast', () => {
    const el = messageEl();
    el.dispatchEvent(new FocusEvent('focusin', { bubbles: true }));
    expect(setHeldSpy).toHaveBeenCalledWith(message, true);

    setHeldSpy.calls.reset();
    el.dispatchEvent(new FocusEvent('focusout', { bubbles: true, relatedTarget: document.body }));
    expect(setHeldSpy).toHaveBeenCalledWith(message, false);
  });

  it('keeps hold when focus moves between children of the toast', () => {
    const el = messageEl();
    const closeButton = el.querySelector('button') as HTMLElement;

    el.dispatchEvent(new FocusEvent('focusin', { bubbles: true }));
    setHeldSpy.calls.reset();

    el.dispatchEvent(new FocusEvent('focusout', { bubbles: true, relatedTarget: closeButton }));
    expect(setHeldSpy).not.toHaveBeenCalled();
  });

  it('releases hold on mouseleave', () => {
    stubHoverSupport(true);
    const el = messageEl();

    el.dispatchEvent(new MouseEvent('mouseenter'));
    setHeldSpy.calls.reset();
    el.dispatchEvent(new MouseEvent('mouseleave'));

    expect(setHeldSpy).toHaveBeenCalledWith(message, false);
  });

  it('keeps hold on mouseleave while the toast is focused', () => {
    stubHoverSupport(true);
    const el = messageEl();

    el.dispatchEvent(new MouseEvent('mouseenter'));
    el.dispatchEvent(new FocusEvent('focusin', { bubbles: true }));
    setHeldSpy.calls.reset();

    el.dispatchEvent(new MouseEvent('mouseleave'));

    expect(setHeldSpy).toHaveBeenCalledWith(message, true);
  });

  it('binds hover hold to message identity when a newer toast is prepended', () => {
    stubHoverSupport(true);
    const first = message;
    const rows = (): HTMLElement[] =>
      fixture.debugElement.queryAll(By.css('.message')).map(d => d.nativeElement as HTMLElement);

    const initial = rows();
    expect(initial.length).toBe(1);
    initial[0]!.dispatchEvent(new MouseEvent('mouseenter'));
    expect(setHeldSpy).toHaveBeenCalledWith(first, true);
    setHeldSpy.calls.reset();

    const second: MessageV2 = { severity: 'success', detail: 'newer toast' };
    messageService.add(second);
    fixture.detectChanges();

    const stacked = rows();
    expect(stacked.length).toBe(2);
    const newerEl = stacked[0]!;
    const olderEl = stacked[1]!;
    expect(newerEl.textContent).toContain('newer toast');
    expect(olderEl.textContent).toContain('toast');

    // track message: older row stays bound to first, so leave releases first (not the prepended toast).
    olderEl.dispatchEvent(new MouseEvent('mouseleave'));
    expect(setHeldSpy).toHaveBeenCalledWith(first, false);
    expect(setHeldSpy).not.toHaveBeenCalledWith(second, jasmine.anything());

    setHeldSpy.calls.reset();
    newerEl.dispatchEvent(new MouseEvent('mouseenter'));
    expect(setHeldSpy).toHaveBeenCalledWith(second, true);
  });
});
