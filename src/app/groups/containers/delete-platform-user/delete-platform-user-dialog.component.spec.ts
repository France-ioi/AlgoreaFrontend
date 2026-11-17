import { ComponentFixture, TestBed } from '@angular/core/testing';
import { DIALOG_DATA, DialogRef } from '@angular/cdk/dialog';
import { DeletePlatformUserDialogComponent } from './delete-platform-user-dialog.component';

describe('DeletePlatformUserDialogComponent', () => {
  let fixture: ComponentFixture<DeletePlatformUserDialogComponent>;
  let close: jasmine.Spy;

  beforeEach(() => {
    close = jasmine.createSpy('close');
    TestBed.configureTestingModule({
      imports: [ DeletePlatformUserDialogComponent ],
      providers: [
        { provide: DIALOG_DATA, useValue: { login: 'Ada' } },
        { provide: DialogRef, useValue: { close } },
      ],
    });
    fixture = TestBed.createComponent(DeletePlatformUserDialogComponent);
    fixture.detectChanges();
  });

  function confirmButton(): HTMLButtonElement {
    const button = fixture.nativeElement.querySelector('button.danger') as HTMLButtonElement | null;
    if (!button) throw new Error('confirm button missing');
    return button;
  }

  function setLogin(value: string): void {
    const input = fixture.nativeElement.querySelector('input') as HTMLInputElement | null;
    if (!input) throw new Error('login field missing');
    input.value = value;
    input.dispatchEvent(new Event('input'));
    fixture.detectChanges();
  }

  it('shows the login and keeps confirm disabled until the field equals it', () => {
    expect(fixture.nativeElement.textContent).toContain('Ada');
    expect(fixture.nativeElement.textContent).toContain('cannot be restored');
    expect(confirmButton().disabled).toBeTrue();

    setLogin('ada');
    expect(confirmButton().disabled).toBeTrue();
    confirmButton().click();
    expect(close).not.toHaveBeenCalled();

    setLogin(' Ada ');
    expect(confirmButton().disabled).toBeFalse();
    confirmButton().click();
    expect(close).toHaveBeenCalledOnceWith(true);
  });
});
