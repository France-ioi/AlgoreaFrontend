import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, ParamMap } from '@angular/router';
import { EditService } from 'src/app/services/edit.service';

export enum Type {
  student = 'Student',
  teacher = 'Teacher',
  user = 'User',
  school = 'School',
  team = 'Team',
  class = 'Class',
  group = 'Group',
  session = 'Session'
}

export enum JoinMethod {
  accessCode = 'Access code',
  requests = 'Requests',
  invitation = 'Invitation only'
}

@Component({
  selector: 'app-group',
  templateUrl: './group.component.html',
  styleUrls: ['./group.component.scss']
})
export class GroupComponent implements OnInit {
  groupdata;
  status;

  constructor(
    private activatedRoute: ActivatedRoute,
    private editService: EditService
  ) { }

  ngOnInit() {
    this.activatedRoute.queryParamMap.subscribe((paramMap: ParamMap) => {
      const refresh = paramMap.get('refresh');
      if (refresh) {
        console.log(history.state.groupdata);
        this.groupdata = {
          ID: history.state.groupdata.ID,
          name: 'Jean Monnet',
          type: Type.school,
          website: 'www.lyceeloremipsum.com',
          assocActivity: {
            name: 'Concours castor 2019',
            link: 'www.france-ioi.com',
            progress: {
              displayedScore: 80,
              currentScore: 90
            }
          },
          assocSkill: {
            name: 'Concours castor 2018',
            link: 'www.france-ioi.com',
            progress: {
              displayedScore: 80,
              currentScore: 90
            }
          },
          location: '46  Chemin Du Lavarin Sud Cachan Île-de-France France',
          grades: [
            6,
            7,
            9
          ],
          date: new Date(),
          joinMethods: [
            JoinMethod.accessCode,
            JoinMethod.invitation
          ]
        };
        console.log(this.groupdata);
      }
    });

    this.editService.getOb().subscribe(res => {
      this.status = res;
    });
  }

  onExpandWidth(e) {
    
  }

}
