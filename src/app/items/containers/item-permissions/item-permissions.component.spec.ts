import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ItemPermissionsComponent } from './item-permissions.component';
import { ItemData } from '../../models/item-data';
import { mockItem } from '../../mocks/item-by-id';
import { itemRoute } from 'src/app/models/routing/item-route';
import { ItemViewPerm } from '../../models/item-view-permission';
import { ItemGrantViewPerm } from '../../models/item-grant-view-permission';
import { ItemEditPerm } from '../../models/item-edit-permission';
import { ItemWatchPerm } from '../../models/item-watch-permission';
import { GroupPermissionsService } from 'src/app/data-access/group-permissions.service';
import { ActionFeedbackService } from 'src/app/services/action-feedback.service';
import { CurrentContentService } from 'src/app/services/current-content.service';
import { Dialog } from '@angular/cdk/dialog';
import { of } from 'rxjs';
import { backendInfiniteDateString } from 'src/app/utils/date';
import { By } from '@angular/platform-browser';
import { rawGroupRoute } from 'src/app/models/routing/group-route';
import { WatchedGroupPermissions } from '../../models/item-permissions';

const past = new Date('2020-01-01T00:00:00Z');
const future = new Date('2090-01-01T00:00:00Z');
const farFuture = new Date(backendInfiniteDateString);

function watchedPerms(overrides: {
  canView?: ItemViewPerm,
  enteringTimeIntervals?: { canEnterFrom: Date, canEnterUntil: Date }[],
} = {}): WatchedGroupPermissions {
  return {
    canView: overrides.canView ?? ItemViewPerm.Info,
    canGrantView: ItemGrantViewPerm.None,
    canEdit: ItemEditPerm.None,
    canWatch: ItemWatchPerm.None,
    isOwner: false,
    canMakeSessionOfficial: false,
    enteringTimeIntervals: overrides.enteringTimeIntervals ?? [],
  };
}

function makeItemData(overrides: {
  requiresExplicitEntry?: boolean,
  entryMinAdmittedMembersRatio?: 'None' | 'One' | 'Half' | 'All',
  entryParticipantType?: 'User' | 'Team',
  enteringTimeMin?: Date,
  enteringTimeMax?: Date,
  watchedPermissions?: WatchedGroupPermissions,
} = {}): ItemData {
  return {
    route: itemRoute('activity', '1', { attemptId: '0', path: [] }),
    item: {
      ...mockItem,
      requiresExplicitEntry: overrides.requiresExplicitEntry ?? true,
      entryMinAdmittedMembersRatio: overrides.entryMinAdmittedMembersRatio ?? 'None',
      entryParticipantType: overrides.entryParticipantType ?? 'User',
      enteringTimeMin: overrides.enteringTimeMin ?? past,
      enteringTimeMax: overrides.enteringTimeMax ?? farFuture,
      watchedGroup: {
        permissions: overrides.watchedPermissions ?? watchedPerms(),
      },
    },
    breadcrumbs: [],
  };
}

const observedGroup = {
  route: rawGroupRoute({ id: 'g1', isUser: true }),
  name: 'Alice',
  currentUserCanGrantAccess: true,
};

describe('ItemPermissionsComponent explicit entry', () => {
  let fixture: ComponentFixture<ItemPermissionsComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ ItemPermissionsComponent ],
      providers: [
        { provide: GroupPermissionsService, useValue: { getHasPath: () => of(true), updatePermissions: () => of(undefined) } },
        { provide: ActionFeedbackService, useValue: { success: (): void => undefined, unexpectedError: (): void => undefined } },
        { provide: CurrentContentService, useValue: { forceNavMenuReload: (): void => undefined } },
        { provide: Dialog, useValue: { open: () => ({ closed: of(false) }) } },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(ItemPermissionsComponent);
    fixture.componentRef.setInput('observedGroup', observedGroup);
  });

  function expand(): void {
    fixture.componentInstance.collapsed.set(false);
    fixture.detectChanges();
  }

  it('shows can-enter header when content view is granted', () => {
    fixture.componentRef.setInput('itemData', makeItemData({
      watchedPermissions: watchedPerms({ canView: ItemViewPerm.Content }),
    }));
    fixture.detectChanges();
    expect(fixture.nativeElement.textContent).toContain('can enter this activity');
    expect(fixture.nativeElement.textContent).not.toContain('may not be able to');
  });

  it('shows can-enter-if-allowed header for team activities with enter perms', () => {
    fixture.componentRef.setInput('itemData', makeItemData({
      entryParticipantType: 'Team',
      entryMinAdmittedMembersRatio: 'None',
      watchedPermissions: watchedPerms({ canView: ItemViewPerm.Info }),
    }));
    fixture.detectChanges();
    expect(fixture.nativeElement.textContent).toContain('if the activity allows it');
  });

  it('shows may-not-enter header when permissions are insufficient', () => {
    fixture.componentRef.setInput('itemData', makeItemData({
      watchedPermissions: watchedPerms({ canView: ItemViewPerm.None }),
    }));
    fixture.detectChanges();
    expect(fixture.nativeElement.textContent).toContain('may not be able to enter this activity');
  });

  it('shows may-not-enter when User window is closed despite info view', () => {
    fixture.componentRef.setInput('itemData', makeItemData({
      enteringTimeMax: past,
      watchedPermissions: watchedPerms({ canView: ItemViewPerm.Info }),
    }));
    fixture.detectChanges();
    expect(fixture.nativeElement.textContent).toContain('may not be able to enter this activity');
  });

  it('shows may-not-enter when enter permission is required but no current interval', () => {
    fixture.componentRef.setInput('itemData', makeItemData({
      entryMinAdmittedMembersRatio: 'One',
      watchedPermissions: watchedPerms({
        canView: ItemViewPerm.Info,
        enteringTimeIntervals: [],
      }),
    }));
    fixture.detectChanges();
    expect(fixture.nativeElement.textContent).toContain('may not be able to enter this activity');
  });

  it('keeps legacy access header when explicit entry is not required', () => {
    fixture.componentRef.setInput('itemData', makeItemData({
      requiresExplicitEntry: false,
      watchedPermissions: watchedPerms({ canView: ItemViewPerm.Content }),
    }));
    fixture.detectChanges();
    expect(fixture.nativeElement.textContent).toContain('can access this');
  });

  it('renders entry permission info and can-enter indicator when expanded', () => {
    fixture.componentRef.setInput('itemData', makeItemData({
      entryMinAdmittedMembersRatio: 'One',
      watchedPermissions: watchedPerms({
        canView: ItemViewPerm.Info,
        enteringTimeIntervals: [ { canEnterFrom: past, canEnterUntil: future } ],
      }),
    }));
    expand();
    expect(fixture.nativeElement.textContent).toContain('requires a manual action');
    expect(fixture.nativeElement.textContent).toContain('Can enter');
    expect(fixture.debugElement.query(By.css('alg-item-entry-permission-info'))).toBeTruthy();
  });

  it('shows No for empty entering intervals', () => {
    fixture.componentRef.setInput('itemData', makeItemData({
      watchedPermissions: watchedPerms({ enteringTimeIntervals: [] }),
    }));
    expand();
    const section = fixture.debugElement.query(By.css('.permission-indicator-section'));
    expect(section.nativeElement.textContent).toContain('No');
  });

  it('renders From … until … for finite enter intervals', () => {
    fixture.componentRef.setInput('itemData', makeItemData({
      watchedPermissions: watchedPerms({
        enteringTimeIntervals: [ { canEnterFrom: past, canEnterUntil: future } ],
      }),
    }));
    expand();
    const section = fixture.debugElement.query(By.css('.permission-indicator-section'));
    expect(section.nativeElement.textContent).toMatch(/From .+ until .+/);
  });

  it('renders Always for a started interval with infinite until', () => {
    fixture.componentRef.setInput('itemData', makeItemData({
      watchedPermissions: watchedPerms({
        enteringTimeIntervals: [ { canEnterFrom: past, canEnterUntil: farFuture } ],
      }),
    }));
    expand();
    const section = fixture.debugElement.query(By.css('.permission-indicator-section'));
    expect(section.nativeElement.textContent).toContain('Always');
  });
});
