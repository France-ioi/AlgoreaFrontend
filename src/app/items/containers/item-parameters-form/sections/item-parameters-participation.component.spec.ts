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
      [savedIsTimeLimited]="savedIsTimeLimited()"
     />
  `,
  changeDetection: ChangeDetectionStrategy.Eager,
  imports: [ ReactiveFormsModule, ItemParametersParticipationComponent ],
})
class HostComponent {
  control = new FormControl(defaultValue, { nonNullable: true });
  itemType = input<ItemType>('Chapter');
  savedRequiresExplicitEntry = input(false);
  savedIsTimeLimited = input(false);
}

describe('ItemParametersParticipationComponent', () => {
  let fixture: ComponentFixture<HostComponent>;
  let host: HostComponent;

  async function setup(opts: {
    itemType?: ItemType,
    savedRequiresExplicitEntry?: boolean,
    savedIsTimeLimited?: boolean,
    value?: Partial<ItemParametersParticipationValue>,
  } = {}): Promise<void> {
    await TestBed.configureTestingModule({
      imports: [ HostComponent ],
    }).compileComponents();
    fixture = TestBed.createComponent(HostComponent);
    host = fixture.componentInstance;
    fixture.componentRef.setInput('itemType', opts.itemType ?? 'Chapter');
    fixture.componentRef.setInput('savedRequiresExplicitEntry', opts.savedRequiresExplicitEntry ?? false);
    fixture.componentRef.setInput('savedIsTimeLimited', opts.savedIsTimeLimited ?? false);
    const value = { ...defaultValue, ...opts.value };
    if (opts.savedRequiresExplicitEntry !== undefined) {
      value.requiresExplicitEntry = opts.savedRequiresExplicitEntry;
    }
    host.control.setValue(value);
    fixture.detectChanges();
  }

  function convertButton(): HTMLButtonElement {
    return fixture.debugElement.query(By.css('[data-testid="explicit-entry-convert"]')).nativeElement;
  }

  function undoButton(): HTMLButtonElement | null {
    const el = fixture.debugElement.query(By.css('[data-testid="explicit-entry-undo"]'));
    return el !== null ? el.nativeElement as HTMLButtonElement : null;
  }

  function message(): HTMLElement {
    return fixture.debugElement.query(By.css('[data-testid="explicit-entry-message"]')).nativeElement;
  }

  function hasDurationFields(): boolean {
    return fixture.debugElement.query(By.css('[data-testid="entering-time-min-container"]')) !== null;
  }

  it('shows orange convert button and warning panel when saved requiresExplicitEntry is false', async () => {
    await setup({ savedRequiresExplicitEntry: false });
    const btn = convertButton();
    expect(btn.classList.contains('warning')).toBe(true);
    expect(btn.textContent).toContain('Convert this chapter to manual participation');
    expect(undoButton()).toBeNull();
    const msg = message();
    expect(msg.classList.contains('warning')).toBe(true);
    expect(msg.textContent).toContain('not recommended to convert a regular chapter to manual participation');
  });

  it('shows green convert button and info panel when saved requiresExplicitEntry is true', async () => {
    await setup({ savedRequiresExplicitEntry: true });
    const btn = convertButton();
    expect(btn.classList.contains('success')).toBe(true);
    expect(btn.textContent).toContain('Convert this manual-participation chapter to a regular chapter');
    const msg = message();
    expect(msg.classList.contains('info')).toBe(true);
    expect(msg.textContent).toContain('recommended to allow multiple attempts when converting to a regular chapter');
  });

  it('uses task wording when itemType is Task', async () => {
    await setup({ itemType: 'Task', savedRequiresExplicitEntry: false });
    expect(convertButton().textContent).toContain('Convert this task to manual participation');
    expect(message().textContent).toContain('not recommended to convert a regular task to manual participation');
  });

  it('uses time-limited wording when saved duration is set', async () => {
    await setup({ savedRequiresExplicitEntry: true, savedIsTimeLimited: true });
    expect(convertButton().textContent).toContain('Convert this time-limited chapter to a regular chapter');
  });

  it('uses time-limited task wording when itemType is Task', async () => {
    await setup({ itemType: 'Task', savedRequiresExplicitEntry: true, savedIsTimeLimited: true });
    expect(convertButton().textContent).toContain('Convert this time-limited task to a regular task');
  });

  it('flips the control on convert, keeps the panel, and shows Undo', async () => {
    await setup({ savedRequiresExplicitEntry: false });
    convertButton().click();
    fixture.detectChanges();

    expect(host.control.value.requiresExplicitEntry).toBe(true);
    expect(fixture.debugElement.query(By.css('[data-testid="explicit-entry-convert"]'))).toBeNull();
    expect(undoButton()).not.toBeNull();
    expect(message().classList.contains('warning')).toBe(true);
    expect(message().textContent).toContain('not recommended to convert a regular chapter');
  });

  it('restores the control on Undo', async () => {
    await setup({ savedRequiresExplicitEntry: false });
    convertButton().click();
    fixture.detectChanges();
    undoButton()!.click();
    fixture.detectChanges();

    expect(host.control.value.requiresExplicitEntry).toBe(false);
    expect(convertButton().textContent).toContain('Convert this chapter to manual participation');
    expect(undoButton()).toBeNull();
  });

  it('disables convert and undo when the form is disabled', async () => {
    await setup({ savedRequiresExplicitEntry: false });
    host.control.disable();
    fixture.detectChanges();
    expect(convertButton().disabled).toBe(true);

    host.control.enable();
    fixture.detectChanges();
    convertButton().click();
    fixture.detectChanges();
    host.control.disable();
    fixture.detectChanges();
    expect(undoButton()!.disabled).toBe(true);
  });

  it('after convert, matching savedRequiresExplicitEntry hides Undo and shows the opposite convert UI', async () => {
    await setup({ savedRequiresExplicitEntry: false });
    convertButton().click();
    fixture.detectChanges();
    expect(undoButton()).not.toBeNull();
    expect(hasDurationFields()).toBe(true);

    fixture.componentRef.setInput('savedRequiresExplicitEntry', true);
    fixture.detectChanges();

    expect(undoButton()).toBeNull();
    expect(convertButton().classList.contains('success')).toBe(true);
    expect(convertButton().textContent).toContain(
      'Convert this manual-participation chapter to a regular chapter'
    );
    expect(message().classList.contains('info')).toBe(true);
    expect(hasDurationFields()).toBe(true);
  });

  it('converts and undoes in the green direction, toggling duration fields', async () => {
    await setup({ savedRequiresExplicitEntry: true });
    expect(hasDurationFields()).toBe(true);

    convertButton().click();
    fixture.detectChanges();

    expect(host.control.value.requiresExplicitEntry).toBe(false);
    expect(undoButton()).not.toBeNull();
    expect(hasDurationFields()).toBe(false);
    expect(message().classList.contains('info')).toBe(true);

    undoButton()!.click();
    fixture.detectChanges();

    expect(host.control.value.requiresExplicitEntry).toBe(true);
    expect(convertButton().textContent).toContain(
      'Convert this manual-participation chapter to a regular chapter'
    );
    expect(hasDurationFields()).toBe(true);
  });

  it('shows duration fields after converting to manual participation and hides them on Undo', async () => {
    await setup({ savedRequiresExplicitEntry: false });
    expect(hasDurationFields()).toBe(false);

    convertButton().click();
    fixture.detectChanges();
    expect(hasDurationFields()).toBe(true);

    undoButton()!.click();
    fixture.detectChanges();
    expect(hasDurationFields()).toBe(false);
  });
});
