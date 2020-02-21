import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { YourselfPersonalComponent } from './yourself-personal.component';

describe('YourselfPersonalComponent', () => {
  let component: YourselfPersonalComponent;
  let fixture: ComponentFixture<YourselfPersonalComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ YourselfPersonalComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(YourselfPersonalComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
