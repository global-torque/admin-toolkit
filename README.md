# @global-torque/admin-toolkit

Prepare-next server-rendered HTML pattern and Alpine/htmx helper toolkit for
Django/admin consumers.

The package records reusable markup contracts and small client-side behavior
helpers. It does not render application data, own Django template includes,
ship Vue components, read env config, or import private product packages.

## Install

```sh
pnpm add @global-torque/admin-toolkit
```

## Usage

```ts
import { getAdminHtmlPattern, registerAdminAlpine } from '@global-torque/admin-toolkit';

const tableContract = getAdminHtmlPattern('table');
registerAdminAlpine(window.Alpine);
```

## Pattern Coverage

The catalog covers alerts, badges, buttons, cards, empty states, progress bars,
status indicators, tables, tabs, toasts, and modals.

Every pattern records:

- required attributes;
- content regions;
- ARIA expectations;
- loading/error/empty states where relevant;
- dark-mode behavior;
- a Django template example.

## Django Ownership

Django templates own final server-side rendering, escaping, URLs, CSRF,
permissions, model-specific text, and form submission behavior. These contracts
are intended to make low-risk admin UI consistent without turning the host
Django admin into a Vue SPA.

## Release Status

Prepare-next. Do not publish to npm until package-specific contracts,
attribution, admin consumer validation, Alpine integration checks, and visual
verification gates pass.
