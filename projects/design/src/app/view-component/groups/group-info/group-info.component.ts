import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, ParamMap } from '@angular/router';

@Component({
  selector: 'app-group-info',
  templateUrl: './group-info.component.html',
  styleUrls: ['./group-info.component.scss']
})
export class GroupInfoComponent implements OnInit {

  pendingRequests = [
    {
      user: {
        image: 'assets/images/_messi.jpg',
        name: 'DUJARDIN Jean (Jeandu88)',
        activity: 'Terminale',
        content: 'Led ac magna suscipit, sollicitudin urna at, firibus ipsum, Nulla ullarncoper vulputate nisl. Aenean in ex nisl, Suspendisse magna tortor sagittis quis.'
      },
      date: new Date(2019, 12, 31)
    },
    {
      user: {
        image: 'assets/images/_messi.jpg',
        name: 'DENIS Marie-Sophie (MadameSoso)',
        activity: 'Terminale',
        content: 'Led ac magna suscipit, sollicitudin urna at, firibus ipsum, Nulla ullarncoper vulputate nisl. Aenean in ex nisl, Suspendisse magna tortor sagittis quis.'
      },
      date: new Date(2020, 1, 24)
    },
    {
      user: {
        image: 'assets/images/_messi.jpg',
        name: 'GASTARD Frederique (FredGast)',
        activity: 'Terminale',
        content: 'Led ac magna suscipit, sollicitudin urna at, firibus ipsum, Nulla ullarncoper vulputate nisl. Aenean in ex nisl, Suspendisse magna tortor sagittis quis.'
      },
      date: new Date(2020, 2, 12)
    }
  ];

  columns = [
    { field: 'user', header: 'user' },
    { field: 'date', header: 'requested on' }
  ];

  grdata = [
    {
      name: 'Epreuves',
      columns: this.columns
    }
  ];

  title;
  subtitle;
  showJoined = false;

  constructor(
    private activatedRoute: ActivatedRoute
  ) { }

  ngOnInit() {
    this.activatedRoute.queryParamMap.subscribe((paramMap: ParamMap) => {
      const refresh = paramMap.get('refresh');
      if (refresh) {
        this.title = history.state.title;
        this.subtitle = history.state.subtitle;
        this.showJoined = history.state.showJoined;
      }
    });
  }

  onExpandWidth(e) {

  }

}
