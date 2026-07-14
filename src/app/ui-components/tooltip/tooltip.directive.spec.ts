import { Component } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { TooltipDirective } from './tooltip.directive';

function stubHoverMediaQuery(supportsHover: boolean): jasmine.Spy {
  return spyOn(window, 'matchMedia').and.callFake((query: string) => ({
    matches: query === '(hover: hover)' && supportsHover,
    media: query,
    onchange: null,
    addListener: jasmine.createSpy('addListener'),
    removeListener: jasmine.createSpy('removeListener'),
    addEventListener: jasmine.createSpy('addEventListener'),
    removeEventListener: jasmine.createSpy('removeEventListener'),
    dispatchEvent: jasmine.createSpy('dispatchEvent'),
  } as MediaQueryList));
}

@Component({
  template: '<button type="button" [algTooltip]="\'Tooltip text\'">Trigger</button>',
  imports: [TooltipDirective],
})
class TooltipTestHostComponent {}

describe('TooltipDirective', () => {
  let fixture: ComponentFixture<TooltipTestHostComponent>;
  let trigger: HTMLButtonElement;

  afterEach(() => {
    fixture?.destroy();
    document.querySelectorAll('.cdk-overlay-container').forEach(el => el.remove());
  });

  it('does not show a hover tooltip when the device does not support hover', () => {
    stubHoverMediaQuery(false);

    fixture = TestBed.createComponent(TooltipTestHostComponent);
    fixture.detectChanges();
    trigger = fixture.nativeElement.querySelector('button') as HTMLButtonElement;

    trigger.dispatchEvent(new MouseEvent('mouseenter', { bubbles: true }));
    fixture.detectChanges();

    expect(document.querySelector('.cdk-overlay-pane alg-tooltip')).toBeNull();
  });

  it('shows a hover tooltip when the device supports hover', () => {
    stubHoverMediaQuery(true);

    fixture = TestBed.createComponent(TooltipTestHostComponent);
    fixture.detectChanges();
    trigger = fixture.nativeElement.querySelector('button') as HTMLButtonElement;

    trigger.dispatchEvent(new MouseEvent('mouseenter', { bubbles: true }));
    fixture.detectChanges();

    expect(document.querySelector('.cdk-overlay-pane alg-tooltip')).not.toBeNull();
  });

  it('removes overlay host from the CDK container on destroy', () => {
    stubHoverMediaQuery(true);

    fixture = TestBed.createComponent(TooltipTestHostComponent);
    fixture.detectChanges();
    trigger = fixture.nativeElement.querySelector('button') as HTMLButtonElement;

    trigger.dispatchEvent(new MouseEvent('mouseenter', { bubbles: true }));
    fixture.detectChanges();

    expect(document.querySelector('.cdk-overlay-container .cdk-overlay-connected-position-bounding-box')).not.toBeNull();

    fixture.destroy();

    expect(document.querySelector('.cdk-overlay-container .cdk-overlay-connected-position-bounding-box')).toBeNull();
  });
});
