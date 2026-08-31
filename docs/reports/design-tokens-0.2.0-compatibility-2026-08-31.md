# Design tokens 0.2.0 compatibility verification

- Date: 2026-08-31
- Candidate: `@global-torque/admin-toolkit@0.2.0-beta.4`
- Build input: immutable `@global-torque/design-tokens@0.2.0` GitHub release
  artifact; no packed runtime or peer dependency
- Verdict: PASS for source, package, clean-room, and visual compatibility;
  publication remains separately gated

## Dependency evidence

The downloaded design-token tarball matched the immutable release metadata:

- SHA-256:
  `9dda9a5dc975aa14d6e2e8f57555cc58154c14acceb7933ca8fbc863e4ca1278`
- SHA-512:
  `c7d4b02a603ca51a05ac0aa0a3cbcea916663856ca0333036ec69408ba811eb6145d51ee3eb6430cb6102b776990edf097dcd4d877f6c05ac507c69608f5f149`

The stable artifact preserves every public export used by the admin-toolkit
source build. Its generated `index.css`, `theme.css`, and `tokens.json` are
byte-identical to the previously pinned `0.1.0-beta.3` package. The build
inlines `index.css`, so the packed admin-toolkit has no design-token dependency.

## Package gates

`pnpm run ci` passed, including formatting, lint, TypeScript, 11 real Django
fixture renders, 40 Vitest tests with coverage, real Chromium tab behavior,
build, API reports/docs, publint, package type resolution, and public-content
policy.

A locally packed 178-file candidate with SHA-512
`d267ed741fcb968a9d17391e888306ef141c0c26e929e7f6de8fea2d51a1ec2e86322982c96fafb25199037cb0f540965a020485c4423cf314aa7b49f0f717dc`
passed npm and pnpm clean-room installs. Every packed file matched its manifest,
all five public imports loaded at runtime, and TypeScript accepted them with
NodeNext and Bundler resolution. The full clean-room check passed under Node
22.23.1 and Node 24.18.0 with both package managers.

## Independent visual comparison

Playwright compared the published `admin-toolkit@0.2.0-beta.3` package with the
local beta.4 candidate across all 11 pattern fixtures in light and dark mode.
The 22 distinct visual states were captured at 1440x900 and 390x844, producing
44 old/new screenshot pairs. Results:

- standalone CSS SHA-256 for both versions:
  `5782bbf3821d517ee4e4dd66bbeb22a51c48053ad056fe10194e4037b1bc823a`
- screenshot or layout mismatches: 0
- console or page errors: 0

Local screenshots and the machine-readable comparison manifest were retained
with the non-promotable local verification artifact. They are not release
assets.

## Remaining release gates

- `@global-torque/design-tokens@0.2.0` is available as an immutable GitHub
  release asset but was not present on npm during this verification. Only the
  source build uses the exact immutable release URL; clean-room consumers
  install admin-toolkit alone.
- The local beta.4 tarball proves implementation behavior only. A promotable
  artifact must be rebuilt once by tagged CI from a clean protected commit and
  retain its attestation and immutable release sidecars.
- The named i-djadmin host gate and explicit publication authorization remain
  required before publishing beta.4 or promoting admin-toolkit to stable.
