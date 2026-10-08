import { Component, input } from '@angular/core';
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
  template: `
    <button type="button" [algTooltip]="'Tooltip text'" [tooltipEvent]="tooltipEvent()">Trigger</button>
  `,
  imports: [ TooltipDirective ],
})
class TooltipTestHostComponent {
  tooltipEvent = input<'hover' | 'focus' | 'both'>('hover');
}

describe('TooltipDirective', () => {
  let fixture: ComponentFixture<TooltipTestHostComponent>;
  let trigger: HTMLButtonElement;

  afterEach(() => {
    fixture?.destroy();
    document.querySelectorAll('.cdk-overlay-container').forEach(el => el.remove());
  });

  function setup(
    tooltipEvent: 'hover' | 'focus' | 'both' = 'hover',
    supportsHover = true,
  ): void {
    stubHoverMediaQuery(supportsHover);
    fixture = TestBed.createComponent(TooltipTestHostComponent);
    fixture.componentRef.setInput('tooltipEvent', tooltipEvent);
    fixture.detectChanges();
    trigger = fixture.nativeElement.querySelector('button') as HTMLButtonElement;
  }

  function tooltipEl(): Element | null {
    return document.querySelector('.cdk-overlay-pane alg-tooltip');
  }

  it('does not show a hover tooltip when the device does not support hover', () => {
    setup('hover', false);

    trigger.dispatchEvent(new MouseEvent('mouseenter', { bubbles: true }));
    fixture.detectChanges();

    expect(tooltipEl()).toBeNull();
  });

  it('shows a hover tooltip when the device supports hover', () => {
    setup('hover', true);

    trigger.dispatchEvent(new MouseEvent('mouseenter', { bubbles: true }));
    fixture.detectChanges();

    expect(tooltipEl()).not.toBeNull();
  });

  it('shows a focus tooltip on focus and hides on blur', () => {
    setup('focus', false);

    trigger.dispatchEvent(new FocusEvent('focus'));
    fixture.detectChanges();
    expect(tooltipEl()).not.toBeNull();

    trigger.dispatchEvent(new FocusEvent('blur'));
    fixture.detectChanges();
    expect(tooltipEl()).toBeNull();
  });

  it('does not show a focus-mode tooltip on mouseenter', () => {
    setup('focus', true);

    trigger.dispatchEvent(new MouseEvent('mouseenter', { bubbles: true }));
    fixture.detectChanges();

    expect(tooltipEl()).toBeNull();
  });

  it('both mode shows on hover when the device supports hover', () => {
    setup('both', true);

    trigger.dispatchEvent(new MouseEvent('mouseenter', { bubbles: true }));
    fixture.detectChanges();

    expect(tooltipEl()).not.toBeNull();
  });

  it('both mode shows on focus even when the device does not support hover', () => {
    setup('both', false);

    trigger.dispatchEvent(new MouseEvent('mouseenter', { bubbles: true }));
    fixture.detectChanges();
    expect(tooltipEl()).toBeNull();

    trigger.dispatchEvent(new FocusEvent('focus'));
    fixture.detectChanges();
    expect(tooltipEl()).not.toBeNull();
  });

  it('removes overlay host from the CDK container on destroy', () => {
    setup('hover', true);

    trigger.dispatchEvent(new MouseEvent('mouseenter', { bubbles: true }));
    fixture.detectChanges();

    expect(document.querySelector('.cdk-overlay-container .cdk-overlay-connected-position-bounding-box')).not.toBeNull();

    fixture.destroy();

    expect(document.querySelector('.cdk-overlay-container .cdk-overlay-connected-position-bounding-box')).toBeNull();
  });
});
