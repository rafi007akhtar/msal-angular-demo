import { Component, OnDestroy, OnInit } from '@angular/core';
import { filter, takeUntil } from 'rxjs/operators';

import { MsalService, MsalBroadcastService } from '@azure/msal-angular';
import { AuthenticationResult, EventMessage, EventType, InteractionStatus, PopupRequest, RedirectRequest } from '@azure/msal-browser';
import { Subject } from 'rxjs';
import { Router } from '@angular/router';

@Component({
    selector: 'app-root',
    templateUrl: './app.component.html',
    styleUrls: ['./app.component.css']
})
export class AppComponent implements OnInit, OnDestroy {
    title = 'msal-angular demo';
    activeUser: string | undefined = "unknown user";
    isAuthenticated = false;
    authDisplayType: 'popup' | 'redirect' | undefined = 'redirect';

    // we need to unsubscribe to observables once the application closes, for performance reasons
    private unsubscribe = new Subject<void>();

    constructor(
        private msalService: MsalService,
        private msalBroadcastService: MsalBroadcastService,
        private router: Router,
    ) {}

    ngOnInit(): void {
        // We need to set the authentication status if no interactiion with the MSAL server is happening
        this.msalBroadcastService.inProgress$
            .pipe(
                filter((status: InteractionStatus) => status === InteractionStatus.None),
                takeUntil(this.unsubscribe)
            )
            .subscribe({
                next: () => {
                    this.setAuthenticationStatus();
                }
            });

        // use the LOGIN_SUCCESS event from the broadcast subject to handle the login
        this.msalBroadcastService.msalSubject$
            .pipe(
                filter((message: EventMessage) => message.eventType === EventType.LOGIN_SUCCESS),
                takeUntil(this.unsubscribe)
            )
            .subscribe({
                next: (message: EventMessage) => {
                    const authResult = message.payload as AuthenticationResult;
                    this.msalService.instance.setActiveAccount(authResult.account);
                }
            });
    }

    ngOnDestroy(): void {
        this.unsubscribe.next(undefined);
        this.unsubscribe.complete();
    }

    login(): void {
        const request = { scopes: ['User.Read'] }
        switch (this.authDisplayType) {
            case 'popup':
                this.msalService.instance.loginPopup(request as PopupRequest);
                break;
            case 'redirect':
                this.msalService.instance.loginRedirect(request as RedirectRequest);
                break;
            default:
                this.msalService.instance.loginPopup(request as PopupRequest);
        }
    }

    logout(): void {
        switch (this.authDisplayType) {
            case 'popup':
                this.msalService.instance.logoutPopup().then(() => this.postLogout());
                break;
            case 'redirect':
                this.msalService.instance.logoutRedirect();
                break;
            default:
                this.msalService.instance.logout();
        }
    }

    postLogout() {
        this.isAuthenticated = false;
        this.activeUser = undefined;
        this.router.navigate(['/']);
    }

    setAuthenticationStatus() {
        // get the current active account, if any
        let activeAccount = this.msalService.instance.getActiveAccount();

        // if there isn't any but there are a few accounts, set the first one as active (why?)
        if (! activeAccount) {
            const allAccounts = this.msalService.instance.getAllAccounts();
            if (allAccounts.length > 0) {
                activeAccount = allAccounts[0];
                this.msalService.instance.setActiveAccount(activeAccount);
            }
        }

        this.isAuthenticated = !! activeAccount;
        this.activeUser = activeAccount?.name;
        // console.log('active account:', activeAccount);
    }
}
