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

## Setting up Microsoft Azure with the Angular App

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

Additionally, I have set this up such that when you are on a different route (say Profiles) and you logout via popup, you should be redirected to the home page. This is done by creating a `postLogout` method as follows.
```ts
postLogout() {
    this.isAuthenticated = false;
    this.activeUser = undefined;
    this.router.navigate(['/']);
}
```
and chaining it with the `logoutPopup` method like so:
```ts
case 'popup':
    this.msalService.instance.logoutPopup().then(() => this.postLogout());
    break;
```

Now when you logout from a different page, it should take you back to home page.

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

### Using Event Type to Handle Login Success
All the event types and their descriptions can be found in [this](./slide_screenshots/Screenshot%202023-01-21%20133602.png) file. The type we are interested in is the `LOGIN_SUCESS`.

To handle it, we will use the broadcast service.

Start by subscribing to its subject, filtering only the success responses.
When the message is received, parse its payload to `AuthenticationResult` and set its `account` as the active account.
```ts
this.msalBroadcastService.msalSubject$
    .pipe(
        filter((message: EventMessage) => message.eventType === EventType.LOGIN_SUCCESS)
    )
    .subscribe({
        next: (message: EventMessage) => {
            const authResult = message.payload as AuthenticationResult;
            this.msalService.instance.setActiveAccount(authResult.account);
        }
    });
```

At this point of time, the application is subscribing to multiple observables. So for performance reasons, it is necessary to unsubscribe to them once the application closes.

For this, start by creating an `unsubscribe` Subject.
```ts
private unsubscribe = new Subject<void>();
```
Use this variable to complete in the OnDestroy lifecycle.
```ts
export class AppComponent implements OnInit, OnDestroy {
    // ...

    ngOnDestroy(): void {
        this.unsubscribe.next(undefined);
        this.unsubscribe.complete();
    }

    // ...
```

And finally, use `takeUntil` in all the observable pipes and pass this variable to it.
```ts
this.msalBroadcastService.inProgress$
.pipe(
    filter((status: InteractionStatus) => status === InteractionStatus.None)
    filter((status: InteractionStatus) => status === InteractionStatus.None),
    takeUntil(this.unsubscribe)  // this line
)

// ...

this.msalBroadcastService.msalSubject$
.pipe(
    filter((message: EventMessage) => message.eventType === EventType.LOGIN_SUCCESS),
    takeUntil(this.unsubscribe)  // this line
)
```


---

## Decoding the secret key

Do **NOT** do this for any data other than test, but the way to get the decoded token is:
- login to the application via Microsoft SSO
- open dev tools, then go to Application tab
- look for the session data with a "secret" key
- copy the value of this key
- Go to https://jwt.ms/ and paste this data over there (again, don't do this for production data)

That's it. The claims in keys and their values will be shown in the "Decoded token" list. These are what they mean.

<table class="table table-striped">
    <thead>
        <tr>
            <th class="col-sm-1">Claim type</th>
            <th class="col-sm-8">Notes</th>
        </tr>
    </thead>
    <tbody id="claimsTabTBody">
        <tr>
            <td><span class="mono prewrapbreakword">aud</span></td>
            <td>Identifies the intended recipient of the token. In id_tokens, the audience is your app's Application ID,
                assigned to your app in the Azure portal. Your app should validate this value, and reject the token if
                the value does not match. (Same as client id.)</td>
        </tr>
        <tr>
            <td><span class="mono prewrapbreakword">iss</span></td>
            <td>Identifies the security token service (STS) that constructs and returns the token, and the Azure AD
                tenant in which the user was authenticated. If the token was issued by the v2.0 endpoint, the URI will
                end in /v2.0. The GUID that indicates that the user is a consumer user from a Microsoft account is
                9188040d-6c67-4c5b-b112-36a304b66dad. Your app should use the GUID portion of the claim to restrict the
                set of tenants that can sign in to the app, if applicable. (Same as authority, which will have the tenant id.)</td>
        </tr>
        <tr>
            <td><span class="mono prewrapbreakword">iat</span></td>
            <td>"Issued At" indicates when the authentication for this token occurred.</td>
        </tr>
        <tr>
            <td><span class="mono prewrapbreakword">nbf</span></td>
            <td>The "nbf" (not before) claim identifies the time before which the JWT MUST NOT be accepted for
                processing.</td>
        </tr>
        <tr>
            <td><span class="mono prewrapbreakword">exp</span></td>
            <td>The "exp" (expiration time) claim identifies the expiration time on or after which the JWT MUST NOT be
                accepted for processing. It's important to note that a resource may reject the token before this time as
                well - if for example a change in authentication is required or a token revocation has been detected.
            </td>
        </tr>
        <tr>
            <td><span class="mono prewrapbreakword">groups</span></td>
            <td>If the user belongs to some security groups, they will appear here (array).
            </td>
        </tr>
        <tr>
            <td><span class="mono prewrapbreakword">wids</span></td>
            <td>Azure id roles assiged to the user, if any (array).</td>
        </tr>
        <tr>
            <td><span class="mono prewrapbreakword">roles</span></td>
            <td>The user would have these roles (array)</td>
        </tr>
        <tr>
            <td><span class="mono prewrapbreakword">idp</span></td>
            <td>Records the identity provider that authenticated the subject of the token. This value is identical to
                the value of the Issuer claim unless the user account not in the same tenant as the issuer - guests, for
                instance. If the claim is not present, it means that the value of iss can be used instead. For personal
                accounts being used in an orgnizational context (for instance, a personal account invited to an Azure AD
                tenant), the idp claim may be 'live.com' or an STS URI containing the Microsoft account tenant
                9188040d-6c67-4c5b-b112-36a304b66dad.</td>
        </tr>
        <tr>
            <td><span class="mono prewrapbreakword">name</span></td>
            <td>The name claim provides a human-readable value that identifies the subject of the token. The value is
                not guaranteed to be unique, it is mutable, and it's designed to be used only for display purposes. The
                profile scope is required in order to receive this claim.</td>
        </tr>
        <tr>
            <td><span class="mono prewrapbreakword">nonce</span></td>
            <td>The nonce matches the parameter included in the original /authorize request to the IDP. If it does not
                match, your application should reject the token.</td>
        </tr>
        <tr>
            <td><span class="mono prewrapbreakword">oid</span></td>
            <td>The immutable identifier for an object in the Microsoft identity system, in this case, a user account.
                This ID uniquely identifies the user across applications - two different applications signing in the
                same user will receive the same value in the oid claim. The Microsoft Graph will return this ID as the
                id property for a given user account. Because the oid allows multiple apps to correlate users, the
                profile scope is required in order to receive this claim. Note that if a single user exists in multiple
                tenants, the user will contain a different object ID in each tenant - they are considered different
                accounts, even though the user logs into each account with the same credentials.</td>
        </tr>
        <tr>
            <td><span class="mono prewrapbreakword">preferred_username</span></td>
            <td>The primary username that represents the user. It could be an email address, phone number, or a generic
                username without a specified format. Its value is mutable and might change over time. Since it is
                mutable, this value must not be used to make authorization decisions. The profile scope is required in
                order to receive this claim.</td>
        </tr>
        <tr>
            <td><span class="mono prewrapbreakword">rh</span></td>
            <td>An internal claim used by Azure to revalidate tokens. Should be ignored.</td>
        </tr>
        <tr>
            <td><span class="mono prewrapbreakword">sub</span></td>
            <td>The principal about which the token asserts information, such as the user of an app. This value is
                immutable and cannot be reassigned or reused. The subject is a pairwise identifier - it is unique to a
                particular application ID. Therefore, if a single user signs into two different apps using two different
                client IDs, those apps will receive two different values for the subject claim. This may or may not be
                desired depending on your architecture and privacy requirements.</td>
        </tr>
        <tr>
            <td><span class="mono prewrapbreakword">tid</span></td>
            <td>A GUID that represents the Azure AD tenant that the user is from. For work and school accounts, the GUID
                is the immutable tenant ID of the organization that the user belongs to. For personal accounts, the
                value is 9188040d-6c67-4c5b-b112-36a304b66dad. The profile scope is required in order to receive this
                claim.</td>
        </tr>
        <tr>
            <td><span class="mono prewrapbreakword">uti</span></td>
            <td>An internal claim used by Azure to revalidate tokens. Should be ignored.</td>
        </tr>
        <tr>
            <td><span class="mono prewrapbreakword">ver</span></td>
            <td>Indicates the version of the token.</td>
        </tr>
    </tbody>
</table>

Note:
- you can use these info to customize the UI in any way,
- only use the access token to access any web api; don't use any id token for it.

---

## Caching Options
The cache can be stored in session storage or local storage. Local would provide the best user experience but session would be more secure. The default is session.

Furthermore, the cookies can be enforeced to be sent only via HTTPS. So I have enabled this setting for production mode.

These settings can be enabled using the `cache` object inside the MSAL instance factory function. Just below the `auth`, I have added the following code to enable this.

```ts
cache: {
    cacheLocation: "sessionStorage",  // default; the other option is localStorage
    secureCookies: environment.production  // true will enforce the cookies to be sent over only via HTTPS; by default, it is false
},
```

---

## Logging Options
The logging will happen in the browser console, and will be useful for debugging. It can be enabled by adding a `system` object inside the MSAL instance factory function, and inside that a `loggerOptions` object. This object is taking two properties in the code:
- A `loggerCallBack` method, which will contain the log message. I have configured it such that it would only log the message when there is no PII.
- A `logLevel`, to specify the log level, which I have to verbose.

Accordingly, just below the `cache`, the following object is added.
```ts
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
```

---

## Setting Auth Guards
We do not want any unauthorized user to access any routes that should be available post-login only. To enable this, MSAL provides its own authguards.

We start by adding this authguard to the routes we want to guard, in the app-routing.module.ts file.

```ts
{
    path: 'profile',
    component: ProfileComponent,
    canActivate: [MsalGuard]  // this line
},
```
**Note**: do NOT put the authguard in the "/auth" route, or it will break the application.

Next, go to the the app module file, and insert it inside the `providers` array. Additionally, this authguard needs to be configured with the following behaviour:
- when a protected route is accessed without login in, it should redirect to the Microsoft SSO login
- user should login with their creds
- post successful login, the user should be able to view the protected route.

To implement this, the authguard needs to be configured as such, so put the providers as follows:
```ts
providers: [
    // ...
    {
        provide: MSAL_GUARD_CONFIG,
        useFactory: MsalGuardConfigFactory
    },
    // ...
    MsalGuard
]
```
where `MsalGuardConfigFactory` is the factory function that will implement the above behaviour. <br>
This function defined the interaction type of the login (popup / redirect), and provides the permissions for auth request. So the following code has been written accordingly inside the app module file.
```ts
function MsalGuardConfigFactory(): MsalGuardConfiguration {
    return {
        interactionType: InteractionType.Redirect,
        authRequest: {
            scopes: ["User.Read"]
        }
    }
}
```
Note: I have refrained from using popup here, because I noticed that browsers will try to block popups. So it is better to use redirect here.

---

## Using Microsoft Graph to Obtain Profile Info
This will require the use of interceptors. (Full disclosure: this section is not entirely clear to me.)

Start by adding MSAL interceptor in the `providers` array, which would configure `HTTP_INTERCEPTORS` with a `useClass`. Set `multi` to true.

Then, we need to configure the above configuration with a factory function, so add another object in the `providers` array containing the name of this function.

Code:
```ts
providers: [
   // ...
    {
        provide: HTTP_INTERCEPTORS,
        useClass: MsalInterceptor,
        multi: true
    },
    {
        provide: MSAL_INTERCEPTOR_CONFIG,
        useFactory: MsalInterceptorConfigFactory
    },
    // ...
]
```

Define this function in the following way:
- define a protected resource variable, which will set the Microsoft Graph URL, and the scopes,
- return an object containing the interaction type (this time popup), and the above protected resource.
Accordingly, the following function is implemented.
```ts
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
```
Note that I have defined the graph endpoint URL in the [AppConstants](./src/app/constants.ts) class.

Next, we will need to call this endpoint in the profile service using HTTP Client, so start by injecting this dependency in the profile service file.
```ts
constructor(
    private httpClient: HttpClient
) { }
```

Now replace the `getProfile` method with the following, and we should be good.
```ts
getProfile(): Observable<Profile> {
    return this.httpClient.get<Profile>(AppConstants.graphEndpoint);
}
```

Now on logging in and accessing the Profile route, it should obtain info from the Azure directory.

---

## Reauthentication of Access Token

This will be needed when the user has changed password, or the user is removed, or some event has occured that resulted in an auth challege, and reauthentication is needed.

At first, declare to MSAL that the application is capable of supporting reauthentication. This can be done by adding the following inside the `auth` property inside app module.
```ts
clientCapabilities: ['CP1'], 
```

Next, go to the profile component ts file to catch the auth challenge. This is done by adding an `error` block to the `getProfile` subscription.
```ts
getProfile(): void {
    this.profileService.getProfile()
        .subscribe({
            next: (profile: Profile) => {
                this.profile = profile;
            },
            // new code from here
            error:(err) => {
                if (err.status === 401) {
                    if (err.headers.get('www-authenticate')) {
                        this.profileService.handleClaimsChallenge(err);
                    }
                }
            }
        });
}
```
The error is getting caught when the status is 401. We can tell if the error is an auth challenge by checking for the presence of "www-authenticate" inside the error headers.

If a challenge is caught, the handler method is called, which is defined in the profile service file

The handler method will get the info from the header, then extract the exact claim challenge using a process of splitting and finding and splitting, and store the challange in the session. It will then call the `acquireTokenRedirect` method to get a fresh new token for the user.

Accordingly, the following handler method is written.
```ts
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
        claims: window.atob(claimsChallenge)
    });
}
```

Back the app module file, the interceptor function is modified as follows: return the config object with a new key-value pair. The key is `authRequest` and its value is a callback function that would combine the original auth request with the claim challege that will be obtained from the session.
```ts
const claimsChallenge = sessionStorage.getItem('claimsChallenge');  // for reauthentication
return {
    interactionType: InteractionType.Popup,
    protectedResourceMap: myProtectedResourceMap,
    // for reauthentication:
    authRequest: (msalService, req, originalAuthRequest) => {
        return {
            ...originalAuthRequest,
            claims: claimsChallenge ? window.atob(claimsChallenge) : undefined
        }
    }
}
```

Theortically, this should handle reauthentication. I haven't tried it myself.

That's all from the tutorial!

---


