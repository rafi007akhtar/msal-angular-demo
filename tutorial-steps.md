# Tutorial Steps

I have documented all the steps I am taking to finish this tutorial. These steps are applicable if you have forked the [original repo](https://github.com/derisen/msal-angular-demo), and not this one.


## Installing Packages and Running the Server

> Pre-steps (**important**): Delete package-lock.json file. If there is any node_modules folder, then delete that as well. Now proceed.

First, install the packages.
```ps1
npm install
```

Then, install the dependencies, namely, MSAL browser and MSAL angular packages.
```ps1
npm install --save @azure/msal-browser@2.5.1 @azure/msal-angular@2.32.1
```
> **Note.** The MSAL instance login methods will _not_ work with the latest versions of the above packages as of writing this file.
So I've used the following versions of the msal packages.
> ```json
> "@azure/msal-angular": "2.5.1",
> "@azure/msal-browser": "2.32.1",
> ```

Finally, run the server.
```ps1
ng serve
```
---

## Azure App Registration

This section is for getting all the needed details to sync your Angular app with Azure.

First, go to https://portal.azure.com/ and register a new account. (I registered a free account.) <br>
If an account is already registered, sign in using it.

Next, after sign in, search for Azure Active Directory on the home page, and open it.

On the left sidebar, click on App registrations. This will be used to register the URLs of the app.

Click on the New Registration button. Now follow the below steps for registration.

- In the name button, click the name of the application. I entered the same name as the repo name.
- I also selected single tenant.
- In the Redirect URI section, open the "Select a platform" dropdown, and select Single Page Application.
- In the textbox next to it, enter the URL to be registered. I entered http://localhost:4200

The client id and tenant id should now be available in App Registrations.

Go to Authentication page from the left sidebar, and under Single-page application, click on "Add URI" and add the auth URL along with the already-existing localhost. For me, it was http://localhost:4200/auth. Then click Save. <br>
Note: Every URI that MSAL will use has to be present here in this list.

Finally, you can click on API permissions and see the permission strings under Microsoft Graph tab. By default it should be "User.Read".

---

## Setting up Microsoft SSO with the Angular App

Open the app.module.ts file, and write the following factory method in it. It will be used to instantiate an MSAL instance.
Replace with the strings mentioned in the App Registrations page.
```ts
function MSALInstanceFactory(): IPublicClientApplication {
    return new PublicClientApplication({
        const tenantId = 'replace with the tenant id at the end of the URI'
        auth: {
            clientId: 'replace with application id that is registered on azure portal',
            authority: `https://login.microsoftonline.com/${tenantId}`,  // tack on 
            redirectUri: '/auth'  // The redirect URI where authentication responses can be received by your application.
        }
    });
}
```
Now, inside the `providers` array, add the following object that uses the above factory method to instantiate an MSAL object.
```ts
{
    provide: MSAL_INSTANCE,
    useFactory: MSALInstanceFactory
}
```

### Set up Routes for Redirect
Continuing in the app.module.ts file, inside the `providers` array, add two classes: `MsalService` and `MsalBroadcastService`. The first will allow to use the MSAL instance for logging in, logging out, etc. The second will be used to set the current active user. <br>
Then, add `MsalRedirectComponent` to the bootstrap array. It will be needed if the login / login are to happen via redirect. This will target a specific route for redirect during auth.
All in all, the both the arrays should look like this:
```ts
providers: [
    {
        provide: MSAL_INSTANCE,
        useFactory: MSALInstanceFactory
    },
    MsalService,
    MsalBroadcastService
],
bootstrap: [AppComponent, MsalRedirectComponent]
```

Next, go to the app-routing.module.ts file, and add the following route between the existing first and second routes, to make use of the redirect component in the auth route.
```ts
{
    path: 'auth',
    component: MsalRedirectComponent
},
```

Finally, add the router in index.html, below `<app-root></app-root>`.
```html
<app-redirect></app-redirect>
```

### Set up Login
Inside app.component.ts file, create a `login` method. Keep in mind:
- Login can be of two types: popup, and redirect.
- Login would want a request object that would contain all the permissions as a value to a key called "scopes".
- The permissions can be seen on the API Permissions page on the Azure portal.

The login method can be obtained from the `instance` attribute of the `MsalService` service which was added in the `providers` array. It is added in this file through dependency injection.
```ts
constructor(
    private msalService: MsalService
) {}
```

I have created a vairable called `authDisplayType` which will control whether the login should be popup or redirect. By default, I have kept it to pop-up.

With all this in mind, the following logic is implemented for the `login` method.

```ts
authDisplayType: 'popup' | 'redirect' | undefined = 'popup';
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
```

Finally, bound this method to the login button in the HTML file.
```html
<button mat-raised-button (click)="login()">Login</button>
```
Now, clicking on the link should open the SSO pop-up. (If `authDisplayType` is set to "redirect", then it will open the SSO portal in a new page.)

### Set up Logout
Much the same way as login, the following `logout` method is implemented. One minor difference is that there are _three_ types of MSAL logout methods: normal, pop-up and redirect. The first one is put in the `default` block, and the other two in their respective blocks.
```ts
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
```

And correspondingly, this method is bound to the loogout HTML button.
```html
<button mat-raised-button color="accent" (click)="logout()">Logout</button>
```
Now clicking on the Logout button should log you out of the session.

---

## Setting the Active User
For this, we need the `MsalBroadcastService` service that was added in the provider list above, so start by injecting this service inside the constructor in the app.component.ts file.
```ts
constructor(
    private msalService: MsalService,
    private msalBroadcastService: MsalBroadcastService  // add this line
) {}
```

We have added a flag `isAuthenticated` to hold whether or not a user is authenticated for sign in. The algorithm we will follow is as follows.
- Using the MSAL service instance, get the current active account.
- If there are no active accounts but there are available accounts, set the first one to be the active account.
- Set the `isAuthenticated` based on the active account.
- Also, pull the active account name, if available, and set it to `activeUser`.

With all this in mind, the following logic is implemented.
```ts
isAuthenticated = false;
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
}
```

Where should this method be called? We need to set up this checking when the application loads, so we need to implement the `ngOnInit` lifecycle method.
The MSAL broadcast service provides an observable that can tell us whether the application is reacting with the SSO service or not. We need to check for user authentication only when the application is _not_ interacting with the SSO service.

In order do achieve this, the following algorithm is followed:
- use to the `inProgress$` observable of the broadcast service
- pipe and filter only those results when the status interaction status is `None`
- subscribe and call the above `setAuthenticationStatus` method

Accordingly, the following logic is implemented
```ts
export class AppComponent implements OnInit {
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
    // ...
```

### Setting the view based on the auth flag
In the HTML navbar, when the user is authenticated:
- show the logout button, the profile button, and the user name,
- hide the login button.

When the user is not authenticated:
- hide the logout button, the profile button, and the user name,
- show the login button.

Code:
```html
<a *ngIf="isAuthenticated">{{activeUser}}</a>
<a mat-button [routerLink]="['profile']" *ngIf="isAuthenticated">Profile</a>
<button mat-raised-button (click)="login()" *ngIf="!isAuthenticated">Login</button>
<button mat-raised-button color="accent" (click)="logout()" *ngIf="isAuthenticated">Logout</button>
```
---




