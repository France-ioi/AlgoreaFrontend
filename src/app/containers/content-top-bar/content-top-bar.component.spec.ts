import { Component, input, output } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideMockStore } from '@ngrx/store/testing';
import { provideRouter } from '@angular/router';
import { By } from '@angular/platform-browser';
import { of } from 'rxjs';

import { ContentTopBarComponent } from './content-top-bar.component';
import { fromItemContent } from 'src/app/items/store';
import { fromCurrentContent } from 'src/app/store/navigation/current-content/current-content.store';
import { selectActiveItemDisplayedScore, selectActiveItemNoScore } from 'src/app/items/models/scores';
import { fromObservation } from 'src/app/store/observation';
import { LayoutService } from '../../services/layout.service';
import { TabService } from '../../services/tab.service';
import { ActivityNavTreeService, SkillNavTreeService } from '../../services/navigation/item-nav-tree.service';
import { GroupNavTreeService } from '../../services/navigation/group-nav-tree.service';
import { TimeLimitedContentInfoComponent } from '../time-limited-content-info/time-limited-content-info.component';
import { ObservationBarComponent } from '../observation-bar/observation-bar.component';
import { BreadcrumbsComponent } from '../breadcrumbs/breadcrumbs.component';
import { TabBarComponent } from '../../ui-components/tab-bar/tab-bar.component';
import { NeighborWidgetComponent } from '../../ui-components/neighbor-widget/neighbor-widget.component';

@Component({ selector: 'alg-time-limited-content-info', template: '' })
class StubTimeLimitedContentInfoComponent {}

@Component({ selector: 'alg-observation-bar', template: '' })
class StubObservationBarComponent {}

@Component({ selector: 'alg-breadcrumbs', template: '' })
class StubBreadcrumbsComponent {}

@Component({ selector: 'alg-tab-bar', template: '' })
class StubTabBarComponent {
  styleClass = input<string>();
}

@Component({ selector: 'alg-neighbor-widget', template: '' })
class StubNeighborWidgetComponent {
  navigationMode = input<unknown>();
  parent = output<void>();
  left = output<void>();
  right = output<void>();
}

interface SetupOptions {
  showLeftMenuOpener: boolean,
  canDisplayPlatformLogo: boolean,
  showPlatform: boolean,
}

describe('ContentTopBarComponent', () => {
  const layoutServiceStub = {
    fullFrameContentDisplayed$: of(false),
    isNarrowScreen$: of(false),
    toggleLeftMenu: jasmine.createSpy('toggleLeftMenu'),
  };

  const tabServiceStub = {
    shouldDisplayTabBar$: of(false),
  };

  const navNeighborsStub = {
    navigationNeighbors$: of(undefined),
  };

  async function createFixture(options: SetupOptions): Promise<ComponentFixture<ContentTopBarComponent>> {
    TestBed.resetTestingModule();
    await TestBed.configureTestingModule({
      imports: [ ContentTopBarComponent ],
      providers: [
        provideRouter([]),
        provideMockStore({
          selectors: [
            { selector: fromItemContent.selectIsItemContentActive, value: false },
            { selector: fromCurrentContent.selectTitle, value: 'Item title' },
            { selector: fromItemContent.selectActiveContentItem, value: null },
            { selector: fromObservation.selectIsObserving, value: false },
            { selector: selectActiveItemNoScore, value: false },
            { selector: selectActiveItemDisplayedScore, value: { best: 0, current: 0, validated: false } },
            { selector: fromItemContent.selectActiveContentShowPlatformInsteadOfScore, value: options.showPlatform },
            { selector: fromItemContent.selectActiveContentHideHeader, value: false },
            { selector: fromCurrentContent.selectContentRoute, value: null },
          ],
        }),
        { provide: LayoutService, useValue: layoutServiceStub },
        { provide: TabService, useValue: tabServiceStub },
        { provide: ActivityNavTreeService, useValue: navNeighborsStub },
        { provide: SkillNavTreeService, useValue: navNeighborsStub },
        { provide: GroupNavTreeService, useValue: navNeighborsStub },
      ],
    })
      .overrideComponent(ContentTopBarComponent, {
        remove: {
          imports: [
            TimeLimitedContentInfoComponent,
            ObservationBarComponent,
            BreadcrumbsComponent,
            TabBarComponent,
            NeighborWidgetComponent,
          ],
        },
        add: {
          imports: [
            StubTimeLimitedContentInfoComponent,
            StubObservationBarComponent,
            StubBreadcrumbsComponent,
            StubTabBarComponent,
            StubNeighborWidgetComponent,
          ],
        },
      })
      .compileComponents();

    const fixture = TestBed.createComponent(ContentTopBarComponent);
    fixture.componentRef.setInput('showLeftMenuOpener', options.showLeftMenuOpener);
    fixture.componentRef.setInput('canDisplayPlatformLogo', options.canDisplayPlatformLogo);
    fixture.detectChanges();
    return fixture;
  }

  describe('showPlatformLogo', () => {
    it('is true only when the logo can be displayed here and the setting is enabled', async () => {
      const enabledFixture = await createFixture({ showLeftMenuOpener: false, canDisplayPlatformLogo: true, showPlatform: true });
      expect(enabledFixture.componentInstance.showPlatformLogo()).toBeTrue();

      const disabledSettingFixture = await createFixture({
        showLeftMenuOpener: false, canDisplayPlatformLogo: true, showPlatform: false,
      });
      expect(disabledSettingFixture.componentInstance.showPlatformLogo()).toBeFalse();

      const hiddenSlotFixture = await createFixture({ showLeftMenuOpener: false, canDisplayPlatformLogo: false, showPlatform: true });
      expect(hiddenSlotFixture.componentInstance.showPlatformLogo()).toBeFalse();

      const bothOffFixture = await createFixture({ showLeftMenuOpener: false, canDisplayPlatformLogo: false, showPlatform: false });
      expect(bothOffFixture.componentInstance.showPlatformLogo()).toBeFalse();
    });

    it('does not key off the menu opener (decoupled from showLeftMenuOpener)', async () => {
      const fixture = await createFixture({ showLeftMenuOpener: true, canDisplayPlatformLogo: false, showPlatform: true });
      expect(fixture.componentInstance.showPlatformLogo()).toBeFalse();
    });
  });

  describe('score section visibility', () => {
    it('hides the score section when the platform logo is shown', async () => {
      const fixture = await createFixture({ showLeftMenuOpener: false, canDisplayPlatformLogo: true, showPlatform: true });
      expect(fixture.debugElement.query(By.css('.score-section'))).toBeNull();
    });

    it('shows the score section when the platform logo is not shown', async () => {
      const fixture = await createFixture({ showLeftMenuOpener: false, canDisplayPlatformLogo: false, showPlatform: false });
      expect(fixture.debugElement.query(By.css('.score-section'))).not.toBeNull();
    });
  });
});
