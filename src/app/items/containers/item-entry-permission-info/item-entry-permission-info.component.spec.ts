import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ItemEntryPermissionInfoComponent } from './item-entry-permission-info.component';
import { mockItem } from '../../mocks/item-by-id';
import { ItemViewPerm } from '../../models/item-view-permission';
import { ItemGrantViewPerm } from '../../models/item-grant-view-permission';
import { ItemEditPerm } from '../../models/item-edit-permission';
import { ItemWatchPerm } from '../../models/item-watch-permission';
import { backendInfiniteDateString } from 'src/app/utils/date';

const past = new Date('2020-01-01T00:00:00Z');
const future = new Date('2090-01-01T00:00:00Z');
const laterFuture = new Date('2091-06-01T00:00:00Z');
const farFuture = new Date(backendInfiniteDateString);
const now = new Date('2024-06-15T12:00:00Z');

describe('ItemEntryPermissionInfoComponent', () => {
  let fixture: ComponentFixture<ItemEntryPermissionInfoComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ ItemEntryPermissionInfoComponent ],
    }).compileComponents();

    fixture = TestBed.createComponent(ItemEntryPermissionInfoComponent);
  });

  function setInputs(overrides: {
    canView?: ItemViewPerm,
    entryMinAdmittedMembersRatio?: 'None' | 'One',
    entryParticipantType?: 'User' | 'Team',
    enteringTimeMin?: Date,
    enteringTimeMax?: Date,
    intervals?: { canEnterFrom: Date, canEnterUntil: Date }[],
    isUser?: boolean,
  } = {}): void {
    fixture.componentRef.setInput('item', {
      ...mockItem,
      requiresExplicitEntry: true,
      entryMinAdmittedMembersRatio: overrides.entryMinAdmittedMembersRatio ?? 'None',
      entryParticipantType: overrides.entryParticipantType ?? 'User',
      enteringTimeMin: overrides.enteringTimeMin ?? past,
      enteringTimeMax: overrides.enteringTimeMax ?? farFuture,
    });
    fixture.componentRef.setInput('permissions', {
      canView: overrides.canView ?? ItemViewPerm.Info,
      canGrantView: ItemGrantViewPerm.None,
      canEdit: ItemEditPerm.None,
      canWatch: ItemWatchPerm.None,
      isOwner: false,
      canMakeSessionOfficial: false,
      enteringTimeIntervals: overrides.intervals ?? [],
    });
    fixture.componentRef.setInput('isUser', overrides.isUser ?? true);
    fixture.componentRef.setInput('now', now);
    fixture.detectChanges();
  }

  it('explains enter permission when required', () => {
    setInputs({ entryMinAdmittedMembersRatio: 'One' });
    expect(fixture.nativeElement.textContent).toContain('an appropriate enter permission');
  });

  it('explains info-only requirement when enter permission is not required', () => {
    setInputs({ entryMinAdmittedMembersRatio: 'None' });
    expect(fixture.nativeElement.textContent).toContain("needs the 'info' view permission");
    expect(fixture.nativeElement.textContent).not.toContain('an appropriate enter permission');
  });

  it('shows always-open clock line', () => {
    setInputs();
    expect(fixture.nativeElement.textContent).toContain('always open');
  });

  it('shows closedSince clock line', () => {
    setInputs({ enteringTimeMax: past });
    expect(fixture.nativeElement.textContent).toContain('has been closed since');
  });

  it('shows between clock line', () => {
    setInputs({ enteringTimeMin: future, enteringTimeMax: laterFuture });
    expect(fixture.nativeElement.textContent).toContain('will be open between');
  });

  it('shows from clock line', () => {
    setInputs({ enteringTimeMin: future, enteringTimeMax: farFuture });
    expect(fixture.nativeElement.textContent).toContain('will be open from');
  });

  it('shows until clock line', () => {
    setInputs({ enteringTimeMin: past, enteringTimeMax: future });
    expect(fixture.nativeElement.textContent).toContain('will be open until');
  });

  it('shows content-view status without extra conditions', () => {
    setInputs({ canView: ItemViewPerm.Content });
    expect(fixture.nativeElement.textContent).toContain('without extra conditions');
  });

  it('shows allows-entering line when activity allows it', () => {
    setInputs({
      canView: ItemViewPerm.Info,
      enteringTimeMax: farFuture,
    });
    expect(fixture.nativeElement.textContent).toContain('sufficient permissions');
    expect(fixture.nativeElement.textContent).toContain('activity allows entering');
  });

  it('shows allows-entering without a time when the activity window is finite', () => {
    setInputs({
      canView: ItemViewPerm.Info,
      enteringTimeMax: future,
    });
    expect(fixture.nativeElement.textContent).toContain('activity allows entering');
    expect(fixture.nativeElement.textContent).not.toContain('allows entering until');
  });

  it('shows not-allowed status when the activity window is closed', () => {
    setInputs({
      canView: ItemViewPerm.Info,
      enteringTimeMax: past,
    });
    expect(fixture.nativeElement.textContent).toContain('currently does not allow it');
  });

  it('shows no status line when permissions are insufficient', () => {
    setInputs({ canView: ItemViewPerm.None });
    expect(fixture.nativeElement.textContent).not.toContain('sufficient permissions');
    expect(fixture.nativeElement.textContent).not.toContain('without extra conditions');
  });

  it('mentions team conditions when participant type is Team', () => {
    setInputs({ entryParticipantType: 'Team' });
    expect(fixture.nativeElement.textContent).toContain('Teams may also have extra conditions');
  });
});
