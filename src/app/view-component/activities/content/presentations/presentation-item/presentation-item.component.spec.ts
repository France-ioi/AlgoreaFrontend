import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { PresentationItemComponent } from './presentation-item.component';

describe('PresentationItemComponent', () => {
  let component: PresentationItemComponent;
  let fixture: ComponentFixture<PresentationItemComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ PresentationItemComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(PresentationItemComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
