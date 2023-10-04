import { waitForAsync, ComponentFixture, TestBed } from '@angular/core/testing';

import { SubSectionComponent } from './sub-section.component';

describe('SubSectionComponent', () => {
  let component: SubSectionComponent;
  let fixture: ComponentFixture<SubSectionComponent>;

  beforeEach(waitForAsync(() => {
    TestBed.configureTestingModule({
      imports: [ SubSectionComponent ]
    })
      .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(SubSectionComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
