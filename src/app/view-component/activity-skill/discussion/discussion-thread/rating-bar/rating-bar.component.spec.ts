import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { RatingBarComponent } from './rating-bar.component';

describe('RatingBarComponent', () => {
  let component: RatingBarComponent;
  let fixture: ComponentFixture<RatingBarComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ RatingBarComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(RatingBarComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
