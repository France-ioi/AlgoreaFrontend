import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ItemEditAdvancedParametersComponent } from './item-edit-advanced-parameters.component';

describe('ItemEditAdvancedParametersComponent', () => {
  let component: ItemEditAdvancedParametersComponent;
  let fixture: ComponentFixture<ItemEditAdvancedParametersComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ ItemEditAdvancedParametersComponent ]
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(ItemEditAdvancedParametersComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
