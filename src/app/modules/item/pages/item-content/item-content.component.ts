import { Component, EventEmitter, Input, OnChanges, OnDestroy, OnInit, Output, ViewChild } from '@angular/core';
import { appConfig } from 'src/app/shared/helpers/config';
import { ItemData } from '../../services/item-datasource.service';
import { TaskConfig } from '../../services/item-task.service';
import { ItemDisplayComponent, TaskTab } from '../item-display/item-display.component';
import { ActivatedRoute, NavigationEnd, Router } from '@angular/router';
import { distinctUntilChanged, filter, map, startWith } from 'rxjs/operators';
import { Subscription } from 'rxjs';

@Component({
  selector: 'alg-item-content',
  templateUrl: './item-content.component.html',
  styleUrls: [ './item-content.component.scss' ]
})
export class ItemContentComponent implements OnInit, OnChanges, OnDestroy {
  @ViewChild(ItemDisplayComponent) itemDisplayComponent?: ItemDisplayComponent;

  @Input() itemData?: ItemData;
  @Input() taskView?: TaskTab['view'];
  @Input() taskConfig: TaskConfig = { readOnly: false, formerAnswer: null };
  @Input() savingAnswer = false;

  @Output() taskTabsChange = new EventEmitter<TaskTab[]>();
  @Output() taskViewChange = new EventEmitter<TaskTab['view']>();
  @Output() scoreChange = new EventEmitter<number>();
  @Output() skipSave = new EventEmitter<void>();
  @Output() refresh = new EventEmitter<void>();

  showItemThreadWidget = !!appConfig.forumServerUrl;
  attemptId?: string;
  editModeEnabled = false;
  subscription?: Subscription;

  constructor(private router: Router, private route: ActivatedRoute) {
  }

  ngOnInit(): void {
    this.subscription = this.router.events.pipe(
      filter(event => event instanceof NavigationEnd),
      map(() => this.router.url),
      startWith(this.router.url),
      distinctUntilChanged(),
    ).subscribe(url =>
      this.editModeEnabled = url.includes('/edit-children')
    );
  }

  ngOnChanges(): void {
    if (!this.itemData) return;
    this.attemptId = this.itemData.route.attemptId || this.itemData.currentResult?.attemptId;
  }

  ngOnDestroy(): void {
    this.subscription?.unsubscribe();
  }

  onEditModeEnableChange(): void {
    void this.router.navigate([ this.editModeEnabled ? './edit-children' : './' ], {
      relativeTo: this.route,
    });
  }

}
