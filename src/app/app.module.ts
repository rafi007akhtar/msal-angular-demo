import { NgModule } from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';
import { HttpClientModule } from '@angular/common/http';

import { AppRoutingModule } from './app-routing.module';
import { AppComponent } from './app.component';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';

import { MatButtonModule } from '@angular/material/button';
import { MatToolbarModule } from '@angular/material/toolbar';
import { MatListModule } from '@angular/material/list';
import { MatMenuModule } from '@angular/material/menu';
import { MatCardModule } from '@angular/material/card';

import { HomeComponent } from './home/home.component';
import { ProfileComponent } from './profile/profile.component';

import { MSAL_INSTANCE } from '@azure/msal-angular';
import { PublicClientApplication } from '@azure/msal-browser';
import { IPublicClientApplication } from '@azure/msal-browser';
import { MsalService } from '@azure/msal-angular';

function MSALInstanceFactory(): IPublicClientApplication {
    return new PublicClientApplication({
        auth: {
            clientId: '2387afb1-e6a7-4cc9-b7be-19f36ee29ec8',  // application id that is registered on azure portal
            authority: 'https://login.microsoftonline.com/fded63df-9c7a-401b-8848-b320dfddc933',  // tack on the tenant id at the end of the URI
            redirectUri: '/auth'  // The redirect URI where authentication responses can be received by your application.
        }
    });
}

@NgModule({
    declarations: [
        AppComponent,
        HomeComponent,
        ProfileComponent
    ],
    imports: [
        BrowserModule,
        AppRoutingModule,
        BrowserAnimationsModule,
        HttpClientModule,
        MatButtonModule,
        MatToolbarModule,
        MatListModule,
        MatMenuModule,
        MatCardModule
    ],
    providers: [
        {
            provide: MSAL_INSTANCE,
            useFactory: MSALInstanceFactory
        },
        MsalService
    ],
    bootstrap: [AppComponent]
})
export class AppModule { }
