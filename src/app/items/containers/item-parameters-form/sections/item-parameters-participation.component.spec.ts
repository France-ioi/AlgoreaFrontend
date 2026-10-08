import { Component, ChangeDetectionStrategy, input } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { By } from '@angular/platform-browser';
import { FormControl, ReactiveFormsModule } from '@angular/forms';
import { ItemParametersParticipationComponent } from './item-parameters-participation.component';
import { ItemParametersParticipationValue } from 'src/app/items/models/item-parameters';
import { ItemType } from 'src/app/items/models/item-type';

const defaultValue: ItemParametersParticipationValue = {
  allowsMultipleAttempts: false,
  requiresExplicitEntry: false,
  durationEnabled: false,
  duration: null,
  enteringTimeMinEnabled: false,
  enteringTimeMin: null,
  enteringTimeMaxEnabled: false,
  enteringTimeMax: null,
};

@Component({
  template: `
    <alg-item-parameters-participation [formControl]="control"
      [itemType]="itemType()"
      [savedRequiresExplicitEntry]="savedRequiresExplicitEntry()"
      [savedAllowsMultipleAttempts]="savedAllowsMultipleAttempts()"
     />
  `,
  changeDetection: ChangeDetectionStrategy.Eager,
  imports: [ ReactiveFormsModule, ItemParametersParticipationComponent ],
})
class HostComponent {
  control = new FormControl(defaultValue, { nonNullable: true });
  itemType = input<ItemType>('Chapter');
  savedRequiresExplicitEntry = input(false);
  savedAllowsMultipleAttempts = input(false);
}

describe('ItemParametersParticipationComponent', () => {
  let fixture: ComponentFixture<HostComponent>;
  let host: HostComponent;

  async function setup(opts: {
    itemType?: ItemType,
    savedRequiresExplicitEntry?: boolean,
    savedAllowsMultipleAttempts?: boolean,
    value?: Partial<ItemParametersParticipationValue>,
  } = {}): Promise<void> {
    await TestBed.configureTestingModule({
      imports: [ HostComponent ],
    }).compileComponents();
    fixture = TestBed.createComponent(HostComponent);
    host = fixture.componentInstance;
    fixture.componentRef.setInput('itemType', opts.itemType ?? 'Chapter');
    fixture.componentRef.setInput('savedRequiresExplicitEntry', opts.savedRequiresExplicitEntry ?? false);
    fixture.componentRef.setInput('savedAllowsMultipleAttempts', opts.savedAllowsMultipleAttempts ?? false);
    const value = { ...defaultValue, ...opts.value };
    if (opts.savedRequiresExplicitEntry !== undefined) {
      value.requiresExplicitEntry = opts.savedRequiresExplicitEntry;
    }
    if (opts.savedAllowsMultipleAttempts !== undefined) {
      value.allowsMultipleAttempts = opts.savedAllowsMultipleAttempts;
    }
    host.control.setValue(value);
    fixture.detectChanges();
  }

  function explicitEntryRow(): HTMLElement {
    return fixture.debugElement.query(By.css('[data-testid="requires-explicit-entry"]')).nativeElement;
  }

  function toggleExplicitEntrySwitch(): void {
    const switchEl = fixture.debugElement.query(
      By.css('[data-testid="requires-explicit-entry"] alg-switch .switch')
    );
    switchEl.nativeElement.click();
    fixture.detectChanges();
  }

  function adviceIcon(): HTMLElement | null {
    const el = fixture.debugElement.query(By.css('[data-testid="explicit-entry-advice-icon"]'));
    return el !== null ? el.nativeElement as HTMLElement : null;
  }

  function message(): HTMLElement | null {
    const el = fixture.debugElement.query(By.css('[data-testid="explicit-entry-message"]'));
    return el !== null ? el.nativeElement as HTMLElement : null;
  }

  function hasDurationFields(): boolean {
    return fixture.debugElement.query(By.css('[data-testid="entering-time-min-container"]')) !== null;
  }

  it('shows orange warning icon when saved without manual entry and not switched (Chapter)', async () => {
    await setup({ savedRequiresExplicitEntry: false });
    expect(host.control.value.requiresExplicitEntry).toBe(false);
    expect(hasDurationFields()).toBe(false);

    const icon = adviceIcon();
    expect(icon).not.toBeNull();
    expect(icon!.classList.contains('warning')).toBe(true);
    expect(icon!.getAttribute('aria-label')).toContain(
      'not recommended to convert a regular chapter to manual participation'
    );
    expect(message()).toBeNull();
  });

  it('shows orange warning box under the switch when toggled on from no manual entry (Chapter)', async () => {
    await setup({ savedRequiresExplicitEntry: false });
    toggleExplicitEntrySwitch();

    expect(host.control.value.requiresExplicitEntry).toBe(true);
    expect(adviceIcon()).toBeNull();
    const msg = message();
    expect(msg).not.toBeNull();
    expect(msg!.classList.contains('warning')).toBe(true);
    expect(msg!.textContent).toContain('not recommended to convert a regular chapter to manual participation');
    expect(explicitEntryRow().querySelector('.form-item-control')!.contains(msg)).toBe(true);
    expect(explicitEntryRow().querySelector('.form-item-label')!.contains(msg)).toBe(false);
  });

  it('restores warning icon after toggling back to the saved value', async () => {
    await setup({ savedRequiresExplicitEntry: false });
    toggleExplicitEntrySwitch();
    expect(message()).not.toBeNull();

    toggleExplicitEntrySwitch();
    expect(host.control.value.requiresExplicitEntry).toBe(false);
    expect(message()).toBeNull();
    expect(adviceIcon()).not.toBeNull();
    expect(adviceIcon()!.classList.contains('warning')).toBe(true);
  });

  it('shows blue info icon when saved with manual entry and without multiple attempts, not switched (Chapter)', async () => {
    await setup({ savedRequiresExplicitEntry: true, savedAllowsMultipleAttempts: false });
    expect(host.control.value.requiresExplicitEntry).toBe(true);
    expect(hasDurationFields()).toBe(true);

    const icon = adviceIcon();
    expect(icon).not.toBeNull();
    expect(icon!.classList.contains('info')).toBe(true);
    expect(icon!.getAttribute('aria-label')).toContain(
      'recommended to allow multiple attempts when converting to a regular chapter'
    );
    expect(message()).toBeNull();
  });

  it('shows blue info box under the switch when toggled off from manual entry without multiple attempts (Chapter)', async () => {
    await setup({ savedRequiresExplicitEntry: true, savedAllowsMultipleAttempts: false });
    toggleExplicitEntrySwitch();

    expect(host.control.value.requiresExplicitEntry).toBe(false);
    expect(adviceIcon()).toBeNull();
    const msg = message();
    expect(msg).not.toBeNull();
    expect(msg!.classList.contains('info')).toBe(true);
    expect(msg!.textContent).toContain(
      'recommended to allow multiple attempts when converting to a regular chapter'
    );
    expect(explicitEntryRow().querySelector('.form-item-control')!.contains(msg)).toBe(true);
    expect(explicitEntryRow().querySelector('.form-item-label')!.contains(msg)).toBe(false);
  });

  it('shows nothing when saved with manual entry and multiple attempts', async () => {
    await setup({ savedRequiresExplicitEntry: true, savedAllowsMultipleAttempts: true });
    expect(adviceIcon()).toBeNull();
    expect(message()).toBeNull();

    toggleExplicitEntrySwitch();
    expect(host.control.value.requiresExplicitEntry).toBe(false);
    expect(adviceIcon()).toBeNull();
    expect(message()).toBeNull();
  });

  it('uses task wording for the warning icon and box', async () => {
    await setup({ itemType: 'Task', savedRequiresExplicitEntry: false });
    expect(adviceIcon()!.getAttribute('aria-label')).toContain(
      'not recommended to convert a regular task to manual participation'
    );

    toggleExplicitEntrySwitch();
    expect(message()!.textContent).toContain(
      'not recommended to convert a regular task to manual participation'
    );
  });

  it('uses task wording for the info icon and box', async () => {
    await setup({
      itemType: 'Task',
      savedRequiresExplicitEntry: true,
      savedAllowsMultipleAttempts: false,
    });
    expect(adviceIcon()!.getAttribute('aria-label')).toContain(
      'recommended to allow multiple attempts when converting to a regular task'
    );

    toggleExplicitEntrySwitch();
    expect(message()!.textContent).toContain(
      'recommended to allow multiple attempts when converting to a regular task'
    );
  });

  it('shows and hides Duration and entering-time fields with the switch', async () => {
    await setup({ savedRequiresExplicitEntry: false });
    expect(hasDurationFields()).toBe(false);

    toggleExplicitEntrySwitch();
    expect(hasDurationFields()).toBe(true);

    toggleExplicitEntrySwitch();
    expect(hasDurationFields()).toBe(false);
  });
});
