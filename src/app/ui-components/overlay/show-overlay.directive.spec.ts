import { Component, TemplateRef, ViewChild, ViewContainerRef } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { Overlay, OverlayRef } from '@angular/cdk/overlay';
import { TemplatePortal } from '@angular/cdk/portal';
import { ShowOverlayDirective } from './show-overlay.directive';
import { ShowOverlayHoverTargetDirective } from './show-overlay-hover-target.directive';

@Component({
  template: `
    <div [algShowOverlay]="overlayTemplate">
      <span algShowOverlayHoverTarget>Hover target</span>
    </div>
    <ng-template #overlayTemplate>Overlay content</ng-template>
  `,
  imports: [ShowOverlayDirective, ShowOverlayHoverTargetDirective],
})
class ShowOverlayTestHostComponent {
  @ViewChild('overlayTemplate', { static: true }) overlayTemplate!: TemplateRef<unknown>;
}

describe('ShowOverlayDirective', () => {
  let fixture: ComponentFixture<ShowOverlayTestHostComponent>;
  let overlayRef: OverlayRef;

  beforeEach(() => {
    const overlay = TestBed.inject(Overlay);
    const originalCreate = overlay.create.bind(overlay);
    spyOn(overlay, 'create').and.callFake(config => {
      overlayRef = originalCreate(config);
      return overlayRef;
    });
  });

  afterEach(() => {
    fixture?.destroy();
    document.querySelectorAll('.cdk-overlay-container').forEach(el => el.remove());
  });

  it('removes overlay host from the CDK container on destroy', () => {
    fixture = TestBed.createComponent(ShowOverlayTestHostComponent);
    fixture.detectChanges();

    const portal = new TemplatePortal(
      fixture.componentInstance.overlayTemplate,
      fixture.componentRef.injector.get(ViewContainerRef),
    );
    overlayRef.attach(portal);

    expect(document.querySelector('.cdk-overlay-container .cdk-overlay-connected-position-bounding-box')).not.toBeNull();

    fixture.destroy();

    expect(document.querySelector('.cdk-overlay-container .cdk-overlay-connected-position-bounding-box')).toBeNull();
  });
});
