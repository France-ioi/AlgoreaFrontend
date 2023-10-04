import { waitForAsync, ComponentFixture, TestBed } from '@angular/core/testing';

import { ProgressLevelComponent } from './progress-level.component';

describe('ProgressLevelComponent', () => {
  let component: ProgressLevelComponent;
  let fixture: ComponentFixture<ProgressLevelComponent>;

  beforeEach(waitForAsync(() => {
    TestBed.configureTestingModule({
      imports: [ ProgressLevelComponent ]
    })
      .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(ProgressLevelComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
