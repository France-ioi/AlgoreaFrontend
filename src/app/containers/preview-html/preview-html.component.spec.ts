import { ComponentFixture, TestBed } from '@angular/core/testing';
import { By } from '@angular/platform-browser';

import { PreviewHtmlComponent } from './preview-html.component';
import { MessageService } from 'src/app/services/message.service';

describe('PreviewHtmlComponent', () => {
  let component: PreviewHtmlComponent;
  let fixture: ComponentFixture<PreviewHtmlComponent>;
  let messageServiceSpy: jasmine.SpyObj<MessageService>;

  beforeEach(async () => {
    messageServiceSpy = jasmine.createSpyObj<MessageService>('MessageService', [ 'add' ]);
    await TestBed.configureTestingModule({
      imports: [ PreviewHtmlComponent ],
      providers: [
        { provide: MessageService, useValue: messageServiceSpy },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(PreviewHtmlComponent);
    component = fixture.componentInstance;
  });

  it('should render description iframe when there is HTML content', () => {
    component.textContent = '<p>preview</p>';
    fixture.detectChanges();

    const iframe = fixture.debugElement.query(By.css('alg-description-iframe iframe'));
    expect(iframe).toBeTruthy();
    expect((iframe.nativeElement as HTMLIFrameElement).srcdoc).toContain('<p>preview</p>');
  });

  it('should show empty state when there is nothing to preview', () => {
    component.textContent = '   ';
    fixture.detectChanges();

    expect(fixture.debugElement.query(By.css('alg-description-iframe'))).toBeFalsy();
    expect((fixture.nativeElement as HTMLElement).textContent ?? '').toContain('Nothing to preview');
  });

  describe('navigationRequested handling', () => {
    it('should surface url navigation as an info toast (no router, no new tab)', () => {
      component.onPreviewNavigate({ url: 'https://example.com/x' });

      expect(messageServiceSpy.add).toHaveBeenCalledTimes(1);
      const msg = messageServiceSpy.add.calls.mostRecent().args[0];
      expect(msg.severity).toBe('info');
      expect(msg.detail).toContain('https://example.com/x');
      expect(msg.detail).toContain('new tab');
    });

    it('should surface child item navigation as an info toast', () => {
      component.onPreviewNavigate({ itemId: '42', child: true });

      expect(messageServiceSpy.add).toHaveBeenCalledTimes(1);
      const msg = messageServiceSpy.add.calls.mostRecent().args[0];
      expect(msg.severity).toBe('info');
      expect(msg.detail).toContain('42');
      expect(msg.detail).toContain('child');
    });

    it('should surface plain item navigation as an info toast', () => {
      component.onPreviewNavigate({ itemId: '42', child: false });

      expect(messageServiceSpy.add).toHaveBeenCalledTimes(1);
      const msg = messageServiceSpy.add.calls.mostRecent().args[0];
      expect(msg.severity).toBe('info');
      expect(msg.detail).toContain('42');
      expect(msg.detail).not.toContain('child');
      expect(msg.detail).not.toContain('new tab');
    });
  });
});
