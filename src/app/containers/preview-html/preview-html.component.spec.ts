import { ComponentFixture, TestBed } from '@angular/core/testing';
import { By } from '@angular/platform-browser';

import { PreviewHtmlComponent } from './preview-html.component';

describe('PreviewHtmlComponent', () => {
  let component: PreviewHtmlComponent;
  let fixture: ComponentFixture<PreviewHtmlComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ PreviewHtmlComponent ],
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
});
