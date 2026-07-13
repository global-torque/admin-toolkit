# Roadmap

The active public milestone is
[0.2 hardening and public-source cutover](https://github.com/global-torque/admin-toolkit/milestone/1).

Promotion order:

1. Merge reviewed source and governance on protected `main`.
2. Build the initial beta once in a clean Node.js 24 environment and retain its
   exact npm-format tarball, digest, manifest, and source commit.
3. Pass npm and pnpm clean-room verification against those retained bytes.
4. Publish the exact reviewed initial beta with owner-authenticated npm access
   under the `next` tag and validate the registry bytes.
5. Pass the named i-djadmin real-consumer gate.
6. Configure npm trusted publishing, GitHub attestation, and registry provenance
   before automated or stable releases.

The initial `0.2.0-beta.3` prerelease uses an owner-authorized authenticated npm
publication from the retained artifact. The named-consumer gate is required
before automated or stable promotion, not before this manual initial beta.
Deletion of private fallback source remains blocked until the named-consumer
and public-evidence gates pass.
