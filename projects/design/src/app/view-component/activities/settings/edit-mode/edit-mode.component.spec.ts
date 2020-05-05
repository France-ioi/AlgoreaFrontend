import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { SettingsEditModeComponent } from './edit-mode.component';

describe('EditModeComponent', () => {
  let component: SettingsEditModeComponent;
  let fixture: ComponentFixture<SettingsEditModeComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ SettingsEditModeComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(SettingsEditModeComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
