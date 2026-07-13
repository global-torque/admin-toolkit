# RFC 0001: Public 0.2 contract

- Status: Proposed
- Target: `0.2.0-beta.3`
- Last updated: 2026-07-13

## External problem

Server-rendered admin hosts need versioned HTML/Django contracts, reference styles, Alpine providers, htmx hydration, and accessible dialog behavior without adopting Vue.

## Public surface

The supported imports are `.`, `./patterns`, `./alpine`, `./htmx`, and `./styles`. Exports are ESM-only ES2022 with
declarations and Node.js 22 or newer. Undeclared deep imports are private.

## Non-goals

Django authorization/data, Vue, app templates, broad htmx adoption, routes, direct API clients, and product-specific modal ownership remain outside this package.

## Compatibility and release evidence

i-djadmin must install the exact candidate and design-token peer through npm,
then pass Tailwind, Vite, Django, modal/fragment, Unfold collision, and
two-viewport visual gates before automated or stable promotion and before
private fallback source is deleted. The organization owner separately
authorized manual publication of the initial `0.2.0-beta.3` prerelease before
that named-consumer gate.

The initial beta is built and packed once from a clean protected source commit.
Its npm-format tarball, SHA-512 digest, per-file manifest, and source commit
remain immutable. The later automated candidate path additionally requires a
GitHub attestation and registry provenance. A failed candidate receives a new
beta version; no tag or asset is replaced.

## Decision

Accept the initial beta contract after the source pull request, API report,
package tests, clean rooms, and independent review have no unresolved
actionable findings. Named-consumer evidence remains mandatory before
automated or stable promotion and before private fallback source is deleted.
