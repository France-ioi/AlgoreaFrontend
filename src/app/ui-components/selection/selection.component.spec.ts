import { waitForAsync, ComponentFixture, TestBed } from '@angular/core/testing';

import { SelectionComponent } from './selection.component';

describe('SelectionComponent', () => {
  let component: SelectionComponent<string>;
  let fixture: ComponentFixture<SelectionComponent<string>>;

  beforeEach(waitForAsync(() => {
    TestBed.configureTestingModule({
      imports: [ SelectionComponent ]
    })
      .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent<SelectionComponent<string>>(SelectionComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
