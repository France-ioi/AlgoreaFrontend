import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { PickListComponent, PickListType, PickListColor, PickListItemType } from './pick-list.component';
import { NO_ERRORS_SCHEMA } from '@angular/core';

describe('PickListComponent', () => {
  let component: PickListComponent;
  let fixture: ComponentFixture<PickListComponent>;
  const mockList = {
    _id: 0,
    lists: [
      {
        ID: PickListType.NonRequested,
        title: 'Non-requested fields',
        color: PickListColor.NonRequested
      },
      {
        ID: PickListType.Standard,
        title: 'Recommended fields',
        color: PickListColor.Standard
      },
      {
        ID: PickListType.Mandatory,
        title: 'Mandatory fields',
        color: PickListColor.Mandatory
      }
    ],
    items: [
      { ID: 1, title: 'Online', list: PickListType.NonRequested, type: PickListItemType.Normal },
      { ID: 2, title: 'Change Password', list: PickListType.NonRequested, type: PickListItemType.Normal },
      { ID: 3, title: 'E-mail', list: PickListType.Standard, type: PickListItemType.Normal },
      { ID: 4, title: 'Member\'s activity', list: PickListType.Standard, type: PickListItemType.Normal },
      { ID: 5, title: 'Skills', list: PickListType.Standard, type: PickListItemType.Normal },
      { ID: 6, title: 'Participation code', list: PickListType.Standard, type: PickListItemType.Normal },
      { ID: 7, title: 'First name', list: PickListType.Mandatory, type: PickListItemType.Normal },
      { ID: 8, title: 'Last name', list: PickListType.Mandatory, type: PickListItemType.Normal },
      { ID: 9, title: 'Login', list: PickListType.Mandatory, type: PickListItemType.Normal },
      { ID: 10, title: 'Locked into Group', list: PickListType.Mandatory, type: PickListItemType.Lock }
    ]
  };

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ PickListComponent ],
      schemas: [ NO_ERRORS_SCHEMA ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(PickListComponent);
    component = fixture.componentInstance;
    component.list = mockList;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
