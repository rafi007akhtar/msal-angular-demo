import { Component } from '@angular/core';

import { MsalService } from '@azure/msal-angular';

@Component({
    selector: 'app-root',
    templateUrl: './app.component.html',
    styleUrls: ['./app.component.css']
})
export class AppComponent {
    title = 'msal-angular demo';
    activeUser: string | undefined = "unknown user";

    constructor(
        private msalService: MsalService
    ) {}

    login(): void {
        this.msalService.instance.loginPopup();
    }
}
