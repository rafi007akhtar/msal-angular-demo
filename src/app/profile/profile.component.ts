import { Component, OnChanges, OnInit } from '@angular/core';
import { Profile } from '../profile';
import { ProfileService } from '../profile.service';

@Component({
    selector: 'app-profile',
    templateUrl: './profile.component.html',
    styleUrls: ['./profile.component.css']
})
export class ProfileComponent implements OnInit, OnChanges {

    profile: Profile = {};

    constructor(private profileService: ProfileService) { }

    ngOnInit(): void {
        console.log('profile oninit')
        this.getProfile();
    }

    ngOnChanges() {
        console.log('profile onchange');
    }

    getProfile(): void {
        this.profileService.getProfile()
            .subscribe({
                next: (profile: Profile) => {
                    this.profile = profile;
                },
                error:(err) => {
                    if (err.status === 401) {
                        if (err.headers.get('www-authenticate')) {
                            this.profileService.handleClaimsChallenge(err);
                        }
                    }
                }
            });
    }

}
