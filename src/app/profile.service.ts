import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { MsalService } from '@azure/msal-angular';
import { AccountInfo } from '@azure/msal-browser';
import { Observable } from 'rxjs';
import { AppConstants } from './constants';

import { Profile } from './profile';

@Injectable({
    providedIn: 'root'
})
export class ProfileService {

    constructor(
        private httpClient: HttpClient,
        private msalService: MsalService
    ) { }

    getProfile(): Observable<Profile> {
        return this.httpClient.get<Profile>(AppConstants.graphEndpoint);
    }

    handleClaimsChallenge(res: any) {
        const authenticateHeader: string = res.headers.get('www-authenticate');

        // I don't really understand the logic behind this
        const claimsChallenge: any = authenticateHeader
            ?.split(' ')
            ?.find(elem => elem.includes('claims='))
            ?.split('claims="')[1]
            ?.split('",')[0];

        // this is optional, and needed if you will do something with this data
        sessionStorage.setItem('claimsChallenge', claimsChallenge);
        

        // reauthenticate the user, and give them a fresh new token
        this.msalService.instance.acquireTokenRedirect({
            account: this.msalService.instance.getActiveAccount() as AccountInfo,
            scopes: ['User.Read'],
            // claims: Buffer.from(claimsChallenge, 'base64').toString('base64'),
            claims: window.atob(claimsChallenge)  // deprecated
        });
    }
}
