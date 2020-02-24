import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { DiscussionThreadComponent } from './discussion-thread.component';

describe('DiscussionThreadComponent', () => {
  let component: DiscussionThreadComponent;
  let fixture: ComponentFixture<DiscussionThreadComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ DiscussionThreadComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(DiscussionThreadComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
