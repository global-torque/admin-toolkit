# @global-torque/admin-toolkit

> **Public 0.2 prerelease:** install the exact beta version. The public API may
> still change before the stable 0.2 release.

Versioned neutral contracts for server-rendered admin HTML, complete HTML and
Django fixtures, accessible dialog behavior, Alpine registration, repeat-safe
htmx hydration, and opt-in reference CSS.

The published runtime does not render application data, execute Django
templates, own authorization or CSRF, read environment configuration, or
import private app packages. Source verification executes the fixture catalog
with a hash-locked Django test environment.

## Compatibility

| Contract      | Supported                                      |
| ------------- | ---------------------------------------------- |
| Runtime       | ESM-only, ES2022                               |
| Node.js       | 22.x and 24.x; 26.x informational              |
| Alpine        | 3.14.x (verified with 3.14.9)                  |
| htmx          | 2.0.x (verified with 2.0.10)                   |
| Design tokens | `>=0.1.0-0 <0.2.0`                             |
| CSS           | Modern browsers with custom properties/`:is()` |

Install the exact reviewed npm prereleases:

```sh
pnpm add @global-torque/admin-toolkit@0.2.0-beta.3 @global-torque/design-tokens@0.1.0-beta.3
```

The source manifest pins the development copy of
`@global-torque/design-tokens` to exact registry version `0.1.0-beta.3`; it
never builds or imports a private sibling as a fallback. Release and consumer
gates verify installed files against the retained SHA-512 manifest before
running type, test, build, and i-djadmin commands.

## Public exports

- `@global-torque/admin-toolkit`: every TypeScript contract and helper.
- `@global-torque/admin-toolkit/patterns`: schema, catalog, lookup, and error.
- `@global-torque/admin-toolkit/alpine`: state providers, registration, and
  accessible dialog controller.
- `@global-torque/admin-toolkit/htmx`: instance-scoped hydration and htmx
  installation.
- `@global-torque/admin-toolkit/styles`: neutral `gt-*` reference CSS.

Generated API documentation starts at
[`docs/api/admin-toolkit.md`](docs/api/admin-toolkit.md); the committed public
contract is `etc/admin-toolkit.api.md`. The stylesheet URL facade has its own
[`docs/api-styles/admin-toolkit.md`](docs/api-styles/admin-toolkit.md) reference
and `etc/admin-toolkit-styles.api.md` report.

## Pattern schema and lookup

Every pattern uses schema version `0.2.0` and declares structured elements with
cardinality, required attributes, named regions, IDREF relationships, states,
public design-token references, keyboard commands, focus rules, behavior IDs,
a complete neutral HTML fixture, and a complete Django fixture. Committed
`djangoRenderedFixtures` cover representative loop, condition, disabled,
urgent, sorted, and empty outputs; CI applies schema, duplicate-ID, IDREF,
parse5, and axe checks to those render outputs as well as the neutral fixture.

`fixtures/django-render-cases.json` separately commits one context and exact
expected Django output for every catalog pattern. `pnpm run test:django` builds
the current TypeScript catalog, creates an ignored package-local virtual
environment when needed, installs Django 5.2.16 and its transitive dependencies
from hash-pinned wheels, runs `pip check`, verifies the installed versions,
loads every `djangoFixture` from the built catalog, and compares real Django
output byte-for-byte. The lock includes `typing_extensions` for Python 3.10 and
`tzdata` for Windows through explicit environment markers. CPython 3.10 or
newer is required; globally installed Django is neither read nor trusted.

```ts
import {
  UnknownAdminPatternError,
  findAdminHtmlPattern,
  getAdminHtmlPattern,
} from '@global-torque/admin-toolkit/patterns';

const table = getAdminHtmlPattern('table');
const optional = findAdminHtmlPattern(userSuppliedId);

try {
  getAdminHtmlPattern(requestedPattern);
} catch (error) {
  if (!(error instanceof UnknownAdminPatternError)) throw error;
}
```

The catalog covers alerts, badges, buttons, cards, empty states, progress,
status indicators, tables, tabs, toast stacks, and modal dialogs. Catalog and
nested records are deeply frozen.

## Alpine and dialog lifecycle

`registerAdminAlpine()` is idempotent for each Alpine instance/prefix pair and
rejects prefixes that are not valid JavaScript identifiers. It registers
disclosure, dismissible, runtime-validated unique-ID toast-stack, and tab
providers. Tab navigation skips both configured and DOM-disabled tabs.

```ts
import {
  createDialogController,
  registerAdminAlpine,
} from '@global-torque/admin-toolkit/alpine';

registerAdminAlpine(window.Alpine);

const dialog = document.querySelector<HTMLElement>('[role="dialog"]')!;
const trigger = document.querySelector<HTMLElement>('[data-open-dialog]')!;
const controller = createDialogController(dialog, { trigger });
trigger.addEventListener('click', () => controller.open(trigger));
```

The controller moves focus to the explicit/first tabbable control, excludes
negative-tabindex, inert, hidden, and disabled-fieldset descendants, traps Tab
within the open dialog, closes on Escape when enabled, handles
`data-gt-dialog-close`, reconciles reentrant lifecycle callbacks, restores focus
to the invoker, and permanently removes listeners through `destroy()`. A dialog
element can have only one live controller; call `destroy()` before creating a
replacement controller for the same element.

## htmx hydration

```ts
import { installHtmxHydration } from '@global-torque/admin-toolkit/htmx';

const unsubscribe = installHtmxHydration(window.htmx, window.Alpine);
// Later, during host teardown:
unsubscribe();
```

Each inserted root is initialized once. A forced hydration always calls Alpine
`destroyTree()` when available, then `initTree()`, including the first forced
visit. Repeated installations for the same htmx/Alpine pair share one listener
and use reference-counted teardown. Installation requires htmx `onLoad()` to
return the exact removable listener and removes it through
`off('htmx:load', listener)`.

## Reference styles

Install the design-token peer and import the opt-in stylesheet:

```css
@import '@global-torque/admin-toolkit/styles';
```

All selectors use the `gt-` namespace to avoid broad Django/Unfold collisions.
The built stylesheet deterministically inlines the exact peer token CSS, so the
JavaScript URL facade also works as a standalone stylesheet without an
unresolvable bare `@import`. It uses only public neutral tokens, explicit focus
styles, logical properties, and reduced-motion-safe transitions. Hosts may
replace it while retaining the HTML contract or import the design-token CSS
separately when composing a larger Tailwind entrypoint.

## Django ownership and security

Django owns escaping, authorization, object permissions, CSRF tokens, form
validation, trusted URLs, translation, pagination, database access, and final
server rendering. Fixtures intentionally avoid `|safe`; the Django gate proves
that markup-looking context values remain escaped. Hosts must never insert
untrusted raw HTML or derive authorization from client-side state. Alpine and
htmx enhance already-authorized server output and are not security boundaries.
The real-Django catalog gate proves template syntax and deterministic reference
outputs; it is not a substitute for the named i-djadmin gate, which must render
the exact package artifact in its host configuration before automated or
stable promotion and before private fallback source is deleted.

## Breaking migration from 0.1

- Replace prose fields such as `aria`, `darkMode`, and `djangoExample` with the
  versioned structured fields and `djangoFixture`.
- `getAdminHtmlPattern()` now accepts runtime input and throws
  `UnknownAdminPatternError`; use `findAdminHtmlPattern()` for optional lookup.
- Replace `./behaviors` and `./register` with `./alpine`.
- Replace `./hydrate` with `./htmx`; installation now returns unsubscribe and
  ignores duplicate roots unless forced.
- Replace `./types` imports with the root export.
- Add the design-token peer and import `./styles` explicitly when using the
  reference presentation.

## Ownership, contribution, and rollback

The Global Torque Admin UI maintainers own the generic schema, fixtures,
lifecycle helpers, compatibility matrix, and release decision. Django hosts own
their product templates, security, data, and visual acceptance. Contributions
start with a package-repository issue and must update schema/fixture tests, axe
checks, real Alpine/htmx tests, API docs/reports, migration notes, and the
changelog.

During beta, pin exact artifact digests. Roll back by reinstalling the previous
reviewed toolkit and token tarballs together and rerunning the named consumer
matrix. Never replace or retag rejected bytes.

## Clean-room verification

This example is executed from both npm and pnpm artifact installs:

```js clean-room
import assert from 'node:assert/strict';
import {
  ADMIN_PATTERN_SCHEMA_VERSION,
  findAdminHtmlPattern,
  getAdminHtmlPattern,
  registerAdminAlpine,
} from '@global-torque/admin-toolkit';

const names = [];
const alpine = {
  data(name) {
    names.push(name);
  },
};
assert.equal(registerAdminAlpine(alpine).registered, true);
assert.equal(registerAdminAlpine(alpine).registered, false);
assert.equal(names.length, 4);
assert.equal(ADMIN_PATTERN_SCHEMA_VERSION, '0.2.0');
assert.equal(getAdminHtmlPattern('modal').focus.returnToTrigger, true);
assert.equal(findAdminHtmlPattern('unknown'), undefined);
```

Run `pnpm run format:check`, `pnpm run lint`, `pnpm run typecheck`,
`pnpm run test:django`, `pnpm run browser:install`,
`pnpm run test:browser`, `pnpm run test:coverage`, `pnpm run build`,
`pnpm run docs:api`, `pnpm run docs:check`, and `pnpm run package:lint`.
`test:django` may download only the wheels named and hashed in
`scripts/requirements-django.txt` when its local virtual environment is absent;
the verifier statically requires every supported conditional dependency and
then runs `pip check`. Use GitHub private vulnerability reporting for security
issues and public GitHub issues for reproducible generic defects.
