PS D:\.work\rental-software> yarn build
yarn run v1.22.22
$ prisma generate && next build
Environment variables loaded from .env
Prisma schema loaded from prisma\schema.prisma

✔ Generated Prisma Client (v6.13.0) to .\node_modules\@prisma\client in 165ms

Start by importing your Prisma Client (See: https://pris.ly/d/importing-client)

Tip: Want to turn off tips and other hints? https://pris.ly/tip-4-nohints

✅ Production environment validation passed
 ⚠ `eslint` configuration in next.config.ts is no longer supported. See more info here: https://nextjs.org/docs/app/api-reference/cli/next#next-lint-options
 ⚠ Invalid next.config.ts options detected:
 ⚠     Unrecognized key(s) in object: 'eslint'
 ⚠ See more info here: https://nextjs.org/docs/messages/invalid-next-config
   ▲ Next.js 16.0.10 (Turbopack)
   - Environments: .env.local, .env
   - Experiments (use with caution):
     ✓ memoryBasedWorkersCount
     · optimizePackageImports

 ⚠ The "middleware" file convention is deprecated. Please use "proxy" instead. Learn more: https://nextjs.org/docs/messages/middleware-to-proxy
   Creating an optimized production build ...
✅ Production environment validation passed

> Build error occurred
Error: Turbopack build failed with 4 errors:
./node_modules/@clerk/nextjs/dist/esm/client-boundary/controlComponents.js:3:1
Export RedirectToTask doesn't exist in target module
   1 | "use client";
   2 | import "../chunk-BUSYA2B4.js";
>  3 | import {
     | ^^^^^^^^
>  4 |   ClerkLoaded,
     | ^^^^^^^^^^^^^^
>  5 |   ClerkLoading,
     | ^^^^^^^^^^^^^^
>  6 |   ClerkDegraded,
     | ^^^^^^^^^^^^^^
>  7 |   ClerkFailed,
     | ^^^^^^^^^^^^^^
>  8 |   SignedOut,
     | ^^^^^^^^^^^^^^
>  9 |   SignedIn,
     | ^^^^^^^^^^^^^^
> 10 |   Protect,
     | ^^^^^^^^^^^^^^
> 11 |   RedirectToSignIn,
     | ^^^^^^^^^^^^^^
> 12 |   RedirectToSignUp,
     | ^^^^^^^^^^^^^^
> 13 |   RedirectToTask,
     | ^^^^^^^^^^^^^^
> 14 |   RedirectToUserProfile,
     | ^^^^^^^^^^^^^^
> 15 |   AuthenticateWithRedirectCallback,
     | ^^^^^^^^^^^^^^
> 16 |   RedirectToCreateOrganization,
     | ^^^^^^^^^^^^^^
> 17 |   RedirectToOrganizationProfile
     | ^^^^^^^^^^^^^^
> 18 | } from "@clerk/clerk-react";
     | ^^^^^^^^^^^^^^^^^^^^^^^^^^^^^
  19 | import { MultisessionAppSupport } from "@clerk/clerk-react/internal";
  20 | export {
  21 |   AuthenticateWithRedirectCallback,

The export RedirectToTask was not found in module [project]/node_modules/@clerk/clerk-react/dist/index.mjs [app-client] (ecmascript).
Did you mean to import RedirectToTasks?
All exports of the module are statically known (It doesn't have dynamic exports). So it's known statically that the requested export doesn't exist.

Import trace:
  Server Component:
    ./node_modules/@clerk/nextjs/dist/esm/client-boundary/controlComponents.js
    ./node_modules/@clerk/nextjs/dist/esm/index.js
    ./app/layout.tsx


./node_modules/@clerk/nextjs/dist/esm/client-boundary/controlComponents.js:3:1
Export RedirectToTask doesn't exist in target module
   1 | "use client";
   2 | import "../chunk-BUSYA2B4.js";
>  3 | import {
     | ^^^^^^^^
>  4 |   ClerkLoaded,
     | ^^^^^^^^^^^^^^
>  5 |   ClerkLoading,
     | ^^^^^^^^^^^^^^
>  6 |   ClerkDegraded,
     | ^^^^^^^^^^^^^^
>  7 |   ClerkFailed,
     | ^^^^^^^^^^^^^^
>  8 |   SignedOut,
     | ^^^^^^^^^^^^^^
>  9 |   SignedIn,
     | ^^^^^^^^^^^^^^
> 10 |   Protect,
     | ^^^^^^^^^^^^^^
> 11 |   RedirectToSignIn,
     | ^^^^^^^^^^^^^^
> 12 |   RedirectToSignUp,
     | ^^^^^^^^^^^^^^
> 13 |   RedirectToTask,
     | ^^^^^^^^^^^^^^
> 14 |   RedirectToUserProfile,
     | ^^^^^^^^^^^^^^
> 15 |   AuthenticateWithRedirectCallback,
     | ^^^^^^^^^^^^^^
> 16 |   RedirectToCreateOrganization,
     | ^^^^^^^^^^^^^^
> 17 |   RedirectToOrganizationProfile
     | ^^^^^^^^^^^^^^
> 18 | } from "@clerk/clerk-react";
     | ^^^^^^^^^^^^^^^^^^^^^^^^^^^^^
  19 | import { MultisessionAppSupport } from "@clerk/clerk-react/internal";
  20 | export {
  21 |   AuthenticateWithRedirectCallback,

The export RedirectToTask was not found in module [project]/node_modules/@clerk/clerk-react/dist/index.mjs [app-ssr] (ecmascript).
Did you mean to import RedirectToTasks?
All exports of the module are statically known (It doesn't have dynamic exports). So it's known statically that the requested export doesn't exist.

Import trace:
  Server Component:
    ./node_modules/@clerk/nextjs/dist/esm/client-boundary/controlComponents.js
    ./node_modules/@clerk/nextjs/dist/esm/index.js
    ./app/layout.tsx


./node_modules/@clerk/nextjs/dist/esm/client-boundary/uiComponents.js:11:1
Export TaskSelectOrganization doesn't exist in target module
   9 | import React from "react";
  10 | import { useEnforceCorrectRoutingProps } from "./hooks/useEnforceRoutingProps";
> 11 | import {
     | ^^^^^^^^
> 12 |   APIKeys,
     | ^^^^^^^^^^
> 13 |   CreateOrganization,
     | ^^^^^^^^^^
> 14 |   GoogleOneTap,
     | ^^^^^^^^^^
> 15 |   OrganizationList,
     | ^^^^^^^^^^
> 16 |   OrganizationSwitcher,
     | ^^^^^^^^^^
> 17 |   PricingTable,
     | ^^^^^^^^^^
> 18 |   SignInButton,
     | ^^^^^^^^^^
> 19 |   SignInWithMetamaskButton,
     | ^^^^^^^^^^
> 20 |   SignOutButton,
     | ^^^^^^^^^^
> 21 |   SignUpButton,
     | ^^^^^^^^^^
> 22 |   TaskSelectOrganization,
     | ^^^^^^^^^^
> 23 |   UserButton,
     | ^^^^^^^^^^
> 24 |   Waitlist
     | ^^^^^^^^^^
> 25 | } from "@clerk/clerk-react";
     | ^^^^^^^^^^^^^^^^^^^^^^^^^^^^^
  26 | const UserProfile = Object.assign(
  27 |   (props) => {
  28 |     return /* @__PURE__ */ React.createElement(BaseUserProfile, { ...useEnforceCorrectRoutingProps("UserProfile", props) });

The export TaskSelectOrganization was not found in module [project]/node_modules/@clerk/clerk-react/dist/index.mjs [app-client] (ecmascript).
Did you mean to import CreateOrganization?
All exports of the module are statically known (It doesn't have dynamic exports). So it's known statically that the requested export doesn't exist.

Import traces:
  Client Component Browser:
    ./node_modules/@clerk/nextjs/dist/esm/client-boundary/uiComponents.js [Client Component Browser]
    ./app/sign-in/[[...sign-in]]/page.tsx [Client Component Browser]
    ./app/sign-in/[[...sign-in]]/page.tsx [Server Component]

  Client Component SSR:
    ./node_modules/@clerk/nextjs/dist/esm/client-boundary/uiComponents.js [Client Component SSR]
    ./app/sign-in/[[...sign-in]]/page.tsx [Client Component SSR]
    ./app/sign-in/[[...sign-in]]/page.tsx [Server Component]

  Server Component:
    ./node_modules/@clerk/nextjs/dist/esm/client-boundary/uiComponents.js
    ./node_modules/@clerk/nextjs/dist/esm/index.js
    ./app/layout.tsx


./node_modules/@clerk/nextjs/dist/esm/client-boundary/uiComponents.js:11:1
Export TaskSelectOrganization doesn't exist in target module
   9 | import React from "react";
  10 | import { useEnforceCorrectRoutingProps } from "./hooks/useEnforceRoutingProps";
> 11 | import {
     | ^^^^^^^^
> 12 |   APIKeys,
     | ^^^^^^^^^^
> 13 |   CreateOrganization,
     | ^^^^^^^^^^
> 14 |   GoogleOneTap,
     | ^^^^^^^^^^
> 15 |   OrganizationList,
     | ^^^^^^^^^^
> 16 |   OrganizationSwitcher,
     | ^^^^^^^^^^
> 17 |   PricingTable,
     | ^^^^^^^^^^
> 18 |   SignInButton,
     | ^^^^^^^^^^
> 19 |   SignInWithMetamaskButton,
     | ^^^^^^^^^^
> 20 |   SignOutButton,
     | ^^^^^^^^^^
> 21 |   SignUpButton,
     | ^^^^^^^^^^
> 22 |   TaskSelectOrganization,
     | ^^^^^^^^^^
> 23 |   UserButton,
     | ^^^^^^^^^^
> 24 |   Waitlist
     | ^^^^^^^^^^
> 25 | } from "@clerk/clerk-react";
     | ^^^^^^^^^^^^^^^^^^^^^^^^^^^^^
  26 | const UserProfile = Object.assign(
  27 |   (props) => {
  28 |     return /* @__PURE__ */ React.createElement(BaseUserProfile, { ...useEnforceCorrectRoutingProps("UserProfile", props) });

The export TaskSelectOrganization was not found in module [project]/node_modules/@clerk/clerk-react/dist/index.mjs [app-ssr] (ecmascript).
Did you mean to import CreateOrganization?
All exports of the module are statically known (It doesn't have dynamic exports). So it's known statically that the requested export doesn't exist.

Import traces:
  Client Component Browser:
    ./node_modules/@clerk/nextjs/dist/esm/client-boundary/uiComponents.js [Client Component Browser]
    ./app/sign-in/[[...sign-in]]/page.tsx [Client Component Browser]
    ./app/sign-in/[[...sign-in]]/page.tsx [Server Component]

  Client Component SSR:
    ./node_modules/@clerk/nextjs/dist/esm/client-boundary/uiComponents.js [Client Component SSR]
    ./app/sign-in/[[...sign-in]]/page.tsx [Client Component SSR]
    ./app/sign-in/[[...sign-in]]/page.tsx [Server Component]

  Server Component:
    ./node_modules/@clerk/nextjs/dist/esm/client-boundary/uiComponents.js
    ./node_modules/@clerk/nextjs/dist/esm/index.js
    ./app/layout.tsx


    at ./node_modules/ (clerk/nextjs/dist/esm/client-boundary/controlComponents.js:3:1)
    at ./node_modules/ (clerk/nextjs/dist/esm/client-boundary/controlComponents.js:3:1)
    at ./node_modules/ (clerk/nextjs/dist/esm/client-boundary/uiComponents.js:11:1)
    at ./node_modules/ (clerk/nextjs/dist/esm/client-boundary/uiComponents.js:11:1)
error Command failed with exit code 1.
info Visit https://yarnpkg.com/en/docs/cli/run for documentation about this command.
PS D:\.work\rental-software> 