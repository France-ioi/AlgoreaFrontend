import { ComponentFixture, TestBed } from '@angular/core/testing';
import { PropagationEditMenuComponent } from './propagation-edit-menu.component';
import { PossiblyInvisibleChildData } from '../item-children-edit/item-children-edit.component';
import { ItemViewPerm } from 'src/app/items/models/item-view-permission';
import { ItemGrantViewPerm } from 'src/app/items/models/item-grant-view-permission';
import { ItemEditPerm } from 'src/app/items/models/item-edit-permission';
import { ItemWatchPerm } from 'src/app/items/models/item-watch-permission';
import { ContentViewPropagation } from 'src/app/items/models/content-view-propagation-display';

describe('PropagationEditMenuComponent', () => {
  let fixture: ComponentFixture<PropagationEditMenuComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ PropagationEditMenuComponent ],
    }).compileComponents();

    fixture = TestBed.createComponent(PropagationEditMenuComponent);
  });

  function setChildData(overrides: {
    requiresExplicitEntry?: boolean,
    contentViewPropagation?: ContentViewPropagation,
  } = {}): void {
    const child: PossiblyInvisibleChildData = {
      isVisible: true,
      title: 'Child',
      type: 'Task',
      scoreWeight: 1,
      contentViewPropagation: overrides.contentViewPropagation ?? 'none',
      ...(overrides.requiresExplicitEntry !== undefined
        ? { requiresExplicitEntry: overrides.requiresExplicitEntry }
        : {}),
      permissions: {
        canView: ItemViewPerm.Content,
        canGrantView: ItemGrantViewPerm.Content,
        canEdit: ItemEditPerm.All,
        canWatch: ItemWatchPerm.Answer,
        isOwner: true,
      },
    };
    fixture.componentRef.setInput('childData', child);
    fixture.detectChanges();
  }

  function menuIconClassLists(): DOMTokenList[] {
    return Array.from(
      fixture.nativeElement.querySelectorAll('.menu-item-icon i') as NodeListOf<HTMLElement>,
    ).map(el => el.classList);
  }

  it('shows regular wording and icons when requiresExplicitEntry is false', () => {
    setChildData({ requiresExplicitEntry: false });
    const text = fixture.nativeElement.textContent as string;
    expect(text).toContain('Locked and hidden');
    expect(text).toContain('Locked');
    expect(text).toContain('Open');
    const icons = menuIconClassLists();
    expect(icons[0]?.contains('ph-eye-slash')).toBeTrue();
    expect(icons[1]?.contains('ph-lock-simple')).toBeTrue();
    expect(icons[2]?.contains('ph-eye')).toBeTrue();
    expect(icons[2]?.contains('ph-eye-slash')).toBeFalse();
  });

  it('shows regular wording when requiresExplicitEntry is undefined', () => {
    setChildData();
    const text = fixture.nativeElement.textContent as string;
    expect(text).toContain('Locked and hidden');
    expect(text).toContain('Locked');
    expect(text).toContain('Open');
    const icons = menuIconClassLists();
    expect(icons[0]?.contains('ph-eye-slash')).toBeTrue();
    expect(icons[1]?.contains('ph-lock-simple')).toBeTrue();
    expect(icons[2]?.contains('ph-eye')).toBeTrue();
  });

  it('shows explicit-entry wording and icons for requiresExplicitEntry children', () => {
    setChildData({ requiresExplicitEntry: true });
    const text = fixture.nativeElement.textContent as string;
    expect(text).toContain('Hidden');
    expect(text).toContain('View entry page');
    expect(text).toContain('Free entry');
    expect(text).not.toContain('Locked and hidden');
    expect(text).not.toContain('Locked');
    expect(text).not.toContain('Open');
    const icons = menuIconClassLists();
    expect(icons[0]?.contains('ph-eye-slash')).toBeTrue();
    expect(icons[1]?.contains('ph-door')).toBeTrue();
    expect(icons[1]?.contains('ph-lock-simple')).toBeFalse();
    expect(icons[2]?.contains('ph-door-open')).toBeTrue();
    expect(icons[2]?.contains('ph-eye')).toBeFalse();
  });

  it('emits unchanged contentViewPropagation values in explicit-entry mode', () => {
    setChildData({ requiresExplicitEntry: true });
    const emissions: ContentViewPropagation[] = [];
    fixture.componentInstance.clickEvent.subscribe(value => emissions.push(value));

    const buttons = Array.from(
      fixture.nativeElement.querySelectorAll('.menu-item-button') as NodeListOf<HTMLButtonElement>,
    );
    expect(buttons.length).toBe(3);
    for (const button of buttons) {
      button.click();
    }

    expect(emissions).toEqual([ 'none', 'as_info', 'as_content' ]);
  });
});
