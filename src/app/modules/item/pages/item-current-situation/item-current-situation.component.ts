import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';

@Component({
  selector: 'alg-item-current-situation',
  templateUrl: './item-current-situation.component.html',
  styleUrls: ['./item-current-situation.component.scss']
})
export class ItemCurrentSituationComponent implements OnInit {

  viewItems = [
    {label: 'Chapter view', route: './chapter'},
    {label: 'Log view', route: './'}
    ];

  viewSelected = 1;

  constructor(
    private activatedRoute: ActivatedRoute,
    private router: Router
  ) {}

  onViewChanged(selectedIdx: number) {
    // TODO :: Implement routing from alg-selection
    this.viewSelected = selectedIdx;
  }

  ngOnInit(): void {
    // TODO :: Implement routing from alg-selection
  }
}
