import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { YourselfTabComponent } from './yourself-tab.component';

describe('YourselfTabComponent', () => {
  let component: YourselfTabComponent;
  let fixture: ComponentFixture<YourselfTabComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ YourselfTabComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(YourselfTabComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
