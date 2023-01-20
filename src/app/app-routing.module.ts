import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { MsalRedirectComponent } from '@azure/msal-angular';

import { HomeComponent } from './home/home.component';
import { ProfileComponent } from './profile/profile.component';

const routes: Routes = [
    {
        path: 'profile',
        component: ProfileComponent,
    },
    {
        path: 'auth',
        component: MsalRedirectComponent
    },
    {
        path: '',
        component: HomeComponent
    }
];

@NgModule({
    imports: [RouterModule.forRoot(routes)],
    exports: [RouterModule]
})
export class AppRoutingModule { }
