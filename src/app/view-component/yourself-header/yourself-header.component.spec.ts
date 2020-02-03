import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { YourselfHeaderComponent } from './yourself-header.component';

describe('YourselfHeaderComponent', () => {
  let component: YourselfHeaderComponent;
  let fixture: ComponentFixture<YourselfHeaderComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ YourselfHeaderComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(YourselfHeaderComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
