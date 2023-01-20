## Tutorial Steps

I have documented all the steps I am taking to finish this tutorial. These steps are applicable if you have forked the [original repo](https://github.com/derisen/msal-angular-demo), and not this one.

> Pre-steps (**important**): Delete package-lock.json file. If there is any node_modules folder, then delete that, too. Now proceed.

## Installing packages and running the server
First, install the packages.
```ps1
npm install
```
Then, install the dependencies, namely, MSAL browser and MSAL angular packages.
```ps1
npm install --save @azure/msal-browser@2.5.1 @azure/msal-angular@2.32.1
```
> Note: The MSAL instance login methods will _not_ work with the latest versions of the above packages as of writing this file.
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




