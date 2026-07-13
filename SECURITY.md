# Security Policy

Supported versions are the latest reviewed prerelease and stable release only.
Older prereleases are unsupported.

Report vulnerabilities through GitHub private vulnerability reporting:

<https://github.com/global-torque/admin-toolkit/security/advisories/new>

Maintainers will acknowledge a complete report within five business days and
coordinate remediation and disclosure in the private advisory. There is no
verified security mailbox for this package.

Do not include secrets, private content, customer data, raw admin responses, or
unpublished vulnerability details in public issues.

The source-only Django fixture gate creates an ignored local virtual
environment and installs only the exact wheels and SHA-256 hashes in
`scripts/requirements-django.txt`, including the Python 3.10 and Windows-only
conditional dependencies. It verifies installed versions and runs `pip check`.
The gate does not start a server or process external fixture data. Django and
its transitive Python packages are not included in the npm artifact or runtime
dependency graph.
