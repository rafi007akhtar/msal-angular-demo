import { Component, OnInit } from '@angular/core';
import { filter } from 'rxjs/operators';

import { MsalService, MsalBroadcastService } from '@azure/msal-angular';
import { InteractionStatus, PopupRequest, RedirectRequest } from '@azure/msal-browser';

@Component({
    selector: 'app-root',
    templateUrl: './app.component.html',
    styleUrls: ['./app.component.css']
})
export class AppComponent implements OnInit {
    title = 'msal-angular demo';
    activeUser: string | undefined = "unknown user";
    isAuthenticated = false;
    authDisplayType: 'popup' | 'redirect' | undefined = 'popup';

    constructor(
        private msalService: MsalService,
        private msalBroadcastService: MsalBroadcastService
    ) {}

    ngOnInit(): void {
        // We need to set the authentication status if no interactiion with the MSAL server is happening
        this.msalBroadcastService.inProgress$
            .pipe(
                filter((status: InteractionStatus) => status === InteractionStatus.None)
            )
            .subscribe({
                next: () => {
                    this.setAuthenticationStatus();
                }
            });
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
                this.msalService.instance.logoutPopup();
                break;
            case 'redirect':
                this.msalService.instance.logoutRedirect();
                break;
            default:
                this.msalService.instance.logout();
        }
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
