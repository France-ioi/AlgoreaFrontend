import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { SwitchContainerComponent } from './switch-container.component';

describe('SwitchContainerComponent', () => {
  let component: SwitchContainerComponent;
  let fixture: ComponentFixture<SwitchContainerComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ SwitchContainerComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(SwitchContainerComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
