# @global-torque/admin-toolkit

> [!CAUTION]
> This default-branch source is a quarantined pre-0.2 bridge, not an approved
> release candidate. Do not install it from GitHub, a branch, or npm. The 0.2
> cutover remains blocked until its exact design-tokens release asset exists,
> real consumer verification passes, and the public release issue is approved.

Prepare-next server-rendered HTML pattern and Alpine/htmx helper toolkit for
Django/admin consumers.

The package records reusable markup contracts and small client-side behavior
helpers. It does not render application data, own Django template includes,
ship Vue components, read env config, or import private product packages.

## Installation Status

There is no supported installation command for this source revision. Mutable
GitHub and default-branch installs are prohibited. Wait for an approved
immutable prerelease asset and its published checksum/provenance evidence.

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

Quarantined prepare-next source. Do not publish or install until package-specific contracts,
attribution, admin consumer validation, Alpine integration checks, and visual
verification gates pass.

## Support

Use GitHub issues on `global-torque/admin-toolkit` for public package questions,
bug reports, and behavior proposals. Host-application or Django-admin
integration problems should stay in the owning private repository until they
are reduced to a generic package issue.

## Security

Report suspected vulnerabilities through the repository security policy in
`SECURITY.md`. Do not include secrets, customer data, raw request bodies, or
private admin URLs in public issues.

## Changelog And Versioning

Release notes live in `CHANGELOG.md`. The package stays in `0.x` while the
admin contracts, Alpine helpers, and htmx hydration behavior are being validated.
Breaking changes may ship as minor `0.x` releases until a stable `1.0` contract
is declared.

## Ownership And Feedback

Global Torque maintains the public package surface. Host applications own final
Django templates, permissions, data binding, forms, routing, and deployment.
Feedback should identify whether a request changes the generic contract or only
a host implementation.
