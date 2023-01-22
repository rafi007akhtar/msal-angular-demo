import { NgModule } from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';
import { HttpClientModule, HTTP_INTERCEPTORS } from '@angular/common/http';
import { environment } from 'src/environments/environment';

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
import { AppConstants } from './constants';

import { MsalBroadcastService, MsalGuard, MsalGuardConfiguration, MsalInterceptor, MsalInterceptorConfiguration, MsalRedirectComponent, MSAL_GUARD_CONFIG, MSAL_INSTANCE, MSAL_INTERCEPTOR_CONFIG, ProtectedResourceScopes } from '@azure/msal-angular';
import { InteractionType, LogLevel, PublicClientApplication } from '@azure/msal-browser';
import { IPublicClientApplication } from '@azure/msal-browser';
import { MsalService } from '@azure/msal-angular';

function MsalInstanceFactory(): IPublicClientApplication {
    return new PublicClientApplication({
        auth: {
            clientId: '2387afb1-e6a7-4cc9-b7be-19f36ee29ec8',  // application id that is registered on azure portal
            authority: 'https://login.microsoftonline.com/fded63df-9c7a-401b-8848-b320dfddc933',  // tack on the tenant id at the end of the URI
            redirectUri: '/auth'  // The redirect URI where authentication responses can be received by your application.
        },
        cache: {
            cacheLocation: "sessionStorage",  // default; the other option is localStorage
            secureCookies: environment.production  // true will enforce the cookies to be sent over only via HTTPS; by default, it is false
        },
        system: {
            loggerOptions: {
                loggerCallback: (level, message, constainsPii) => {
                    if (! constainsPii) {
                        console.log(message);
                    }
                },
                logLevel: LogLevel.Verbose
            }
        }
    });
}

function MsalGuardConfigFactory(): MsalGuardConfiguration {
    return {
        interactionType: InteractionType.Redirect,
        authRequest: {
            scopes: ["User.Read"]
        }
    }
}

function MsalInterceptorConfigFactory(): MsalInterceptorConfiguration {
    const myProtectedResourceMap = new Map<string, Array<string | ProtectedResourceScopes> | null>();
    myProtectedResourceMap.set(AppConstants.graphEndpoint, [{
        httpMethod: 'GET',
        scopes: ['User.Read']
    }]);
    return {
        interactionType: InteractionType.Popup,
        protectedResourceMap: myProtectedResourceMap
    }
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
            useFactory: MsalInstanceFactory
        },
        {
            provide: MSAL_GUARD_CONFIG,
            useFactory: MsalGuardConfigFactory
        },
        {
            provide: HTTP_INTERCEPTORS,
            useClass: MsalInterceptor,
            multi: true
        },
        {
            provide: MSAL_INTERCEPTOR_CONFIG,
            useFactory: MsalInterceptorConfigFactory
        },
        MsalService,
        MsalBroadcastService,
        MsalGuard
    ],
    bootstrap: [AppComponent, MsalRedirectComponent]
})
export class AppModule { }
