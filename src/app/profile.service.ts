import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { AppConstants } from './constants';

import { Profile } from './profile';

@Injectable({
    providedIn: 'root'
})
export class ProfileService {

    constructor(
        private httpClient: HttpClient
    ) { }

    getProfile(): Observable<Profile> {
        return this.httpClient.get<Profile>(AppConstants.graphEndpoint);
    }
}
