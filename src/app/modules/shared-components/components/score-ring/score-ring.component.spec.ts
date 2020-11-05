import { waitForAsync, ComponentFixture, TestBed } from '@angular/core/testing';

import { ScoreRingComponent } from './score-ring.component';

describe('ScoreRingComponent', () => {
  let component: ScoreRingComponent;
  let fixture: ComponentFixture<ScoreRingComponent>;

  beforeEach(waitForAsync(() => {
    TestBed.configureTestingModule({
      declarations: [ ScoreRingComponent ]
    })
      .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(ScoreRingComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
