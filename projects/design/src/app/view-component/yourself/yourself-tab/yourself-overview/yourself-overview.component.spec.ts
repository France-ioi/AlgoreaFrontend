import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { YourselfOverviewComponent } from './yourself-overview.component';

describe('YourselfOverviewComponent', () => {
  let component: YourselfOverviewComponent;
  let fixture: ComponentFixture<YourselfOverviewComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ YourselfOverviewComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(YourselfOverviewComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
