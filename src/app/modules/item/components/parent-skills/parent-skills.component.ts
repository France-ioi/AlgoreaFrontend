import { Component, Input, OnChanges, OnDestroy, SimpleChanges } from '@angular/core';
import { Subscription } from 'rxjs';
import { map } from 'rxjs/operators';
import { ItemRouter } from 'src/app/shared/routing/item-router';
import { canCurrentUserViewItemContent } from '../../helpers/item-permissions';
import { GetItemParentsService, ItemParent } from '../../http-services/get-item-parents.service';
import { ItemData } from '../../services/item-datasource.service';

interface ParentSkillAdditions {
  isLocked: boolean,
}

@Component({
  selector: 'alg-parent-skills',
  templateUrl: './parent-skills.component.html',
  styleUrls: [ './parent-skills.component.scss' ]
})
export class ParentSkillsComponent implements OnChanges, OnDestroy {
  @Input() itemData?: ItemData;

  state: 'loading' | 'error' | 'ready' = 'loading';
  parents: (ItemParent&ParentSkillAdditions)[] = [];

  private subscription?: Subscription;

  constructor(
    private getItemParentsService: GetItemParentsService,
    private itemRouter: ItemRouter,
  ) {}

  ngOnChanges(_changes: SimpleChanges): void {
    this.reloadData();
  }

  click(parent: ItemParent&ParentSkillAdditions): void {
    if (!this.itemData || parent.isLocked) return;

    this.itemRouter.navigateTo({
      id: parent.id,
      path: this.itemData.route.path.slice(0, -1),
      attemptId: parent.result.attempt_id,
    });
  }

  private reloadData(): void {
    if (this.itemData?.currentResult) {
      this.state = 'loading';
      this.subscription?.unsubscribe();
      this.subscription = this.getItemParentsService.get(this.itemData.item.id, this.itemData.currentResult.attemptId).pipe(
        map(parents => parents.map(parent => ({ ...parent, isLocked: !canCurrentUserViewItemContent(parent) })))
      ).subscribe(
        parents => {
          this.parents = parents;
          this.state = 'ready';
        },
        _err => {
          this.state = 'error';
        }
      );
    } else {
      this.state = 'error';
    }
  }

  ngOnDestroy(): void {
    this.subscription?.unsubscribe();
  }
}
