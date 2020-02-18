import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { MosaicsComponent } from './mosaics.component';

describe('MosaicsComponent', () => {
  let component: MosaicsComponent;
  let fixture: ComponentFixture<MosaicsComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ MosaicsComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(MosaicsComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
