import { HttpClientTestingModule } from '@angular/common/http/testing';
import { ComponentFixture, TestBed } from '@angular/core/testing';

import { GroupManagerListComponent } from './group-manager-list.component';

describe('GroupManagerListComponent', () => {
  let component: GroupManagerListComponent;
  let fixture: ComponentFixture<GroupManagerListComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ GroupManagerListComponent ],
      imports: [ HttpClientTestingModule ]
    })
      .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(GroupManagerListComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
