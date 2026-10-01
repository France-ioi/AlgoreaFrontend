import { ComponentFixture, TestBed } from '@angular/core/testing';
import { NewVersionModalComponent } from './new-version-modal.component';

describe('NewVersionModalComponent', () => {
  let component: NewVersionModalComponent;
  let fixture: ComponentFixture<NewVersionModalComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ NewVersionModalComponent ],
    }).compileComponents();

    fixture = TestBed.createComponent(NewVersionModalComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('reloads the page when Reload is clicked', () => {
    const reloadSpy = jasmine.createSpy('reload');
    Object.defineProperty(component, 'document', {
      value: { defaultView: { location: { reload: reloadSpy } } },
    });

    const button: HTMLButtonElement = fixture.nativeElement.querySelector('button');
    button.click();
    expect(reloadSpy).toHaveBeenCalledTimes(1);
  });
});
