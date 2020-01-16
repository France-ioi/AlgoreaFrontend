import { BrowserModule } from '@angular/platform-browser';
import { NgModule } from '@angular/core';

import { AppRoutingModule } from './app-routing.module';
import { AppComponent } from './app.component';
import { NgDragDropModule } from 'ng-drag-drop';
import { FontAwesomeModule } from '@fortawesome/angular-fontawesome';
import { TreeModule } from 'primeng/tree';
import { HttpClientModule } from '@angular/common/http';

import { PickListComponent } from './pick-list/pick-list.component';
import { SkillProgressComponent } from './skill-progress/skill-progress.component';
import { ScoreRingComponent } from './score-ring/score-ring.component';
import { TreeSelectionDialogComponent } from './tree-selection-dialog/tree-selection-dialog.component';
import { GroupNavigationComponent } from './group-navigation/group-navigation.component';
import { TreeNavigationComponent } from './tree-navigation/tree-navigation.component';
import { BreadcrumbComponent } from './breadcrumb/breadcrumb.component';

@NgModule({
  declarations: [
    AppComponent,
    PickListComponent,
    SkillProgressComponent,
    ScoreRingComponent,
    TreeSelectionDialogComponent,
    GroupNavigationComponent,
    TreeNavigationComponent,
    BreadcrumbComponent
  ],
  imports: [
    BrowserModule,
    AppRoutingModule,
    HttpClientModule,
    NgDragDropModule.forRoot(),
    FontAwesomeModule,
    TreeModule
  ],
  providers: [],
  bootstrap: [AppComponent]
})
export class AppModule { }
