import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { AttemptsViewComponent } from './attempts-view.component';

describe('AttemptsViewComponent', () => {
  let component: AttemptsViewComponent;
  let fixture: ComponentFixture<AttemptsViewComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ AttemptsViewComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(AttemptsViewComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
