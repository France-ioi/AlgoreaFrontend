import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { MosaicItemComponent } from './mosaic-item.component';

describe('MosaicItemComponent', () => {
  let component: MosaicItemComponent;
  let fixture: ComponentFixture<MosaicItemComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ MosaicItemComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(MosaicItemComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
