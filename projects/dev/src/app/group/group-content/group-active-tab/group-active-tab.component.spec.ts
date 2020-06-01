import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { GroupActiveTabComponent } from './group-active-tab.component';
import { RouterTestingModule } from '@angular/router/testing';
import { ActivatedRoute } from '@angular/router';
import { of } from 'rxjs';

describe('GroupActiveTabComponent', () => {
  let component: GroupActiveTabComponent;
  let fixture: ComponentFixture<GroupActiveTabComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      imports: [
        RouterTestingModule
      ],
      providers: [
        {
          provide: ActivatedRoute,
          useValue: {
            url: of([{path: 'overview'}])
          }
        }
      ],
      declarations: [ GroupActiveTabComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(GroupActiveTabComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
