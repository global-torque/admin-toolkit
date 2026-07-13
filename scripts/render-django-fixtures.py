"""Render admin-toolkit catalog templates with the real Django engine."""

from __future__ import annotations

import difflib
import json
import sys
from typing import Any

import django
from django.conf import settings

EXPECTED_DJANGO_VERSION = "5.2.16"


def fail(message: str) -> None:
    print(message, file=sys.stderr)
    raise SystemExit(1)


if django.get_version() != EXPECTED_DJANGO_VERSION:
    fail(
        f"Expected Django {EXPECTED_DJANGO_VERSION}, received {django.get_version()}."
    )

if not settings.configured:
    settings.configure(
        DEBUG=False,
        SECRET_KEY="admin-toolkit-fixture-verifier",
        USE_I18N=False,
        USE_TZ=False,
    )

django.setup()

from django.template import Context, Engine, TemplateSyntaxError  # noqa: E402


def read_payload() -> dict[str, Any]:
    try:
        payload = json.load(sys.stdin)
    except (json.JSONDecodeError, UnicodeDecodeError) as error:
        fail(f"Could not decode the verifier payload: {error}")
    if not isinstance(payload, dict) or not isinstance(payload.get("cases"), list):
        fail("The verifier payload must contain a cases array.")
    return payload


payload = read_payload()
engine = Engine(autoescape=True, debug=False)
failures: list[str] = []

for case in payload["cases"]:
    identifier = case.get("id", "<unknown>") if isinstance(case, dict) else "<invalid>"
    if not isinstance(case, dict):
        failures.append(f"{identifier}: case must be an object")
        continue
    try:
        template = engine.from_string(case["template"])
        rendered = template.render(Context(case["context"], autoescape=True))
    except (KeyError, TypeError, TemplateSyntaxError) as error:
        failures.append(f"{identifier}: Django render failed: {error}")
        continue
    if rendered != case["expected"]:
        diff = "".join(
            difflib.unified_diff(
                case["expected"].splitlines(keepends=True),
                rendered.splitlines(keepends=True),
                fromfile=f"{identifier}.expected",
                tofile=f"{identifier}.django-{EXPECTED_DJANGO_VERSION}",
            )
        )
        failures.append(f"{identifier}: output mismatch\n{diff}")

if failures:
    fail("\n\n".join(failures))

print(
    json.dumps(
        {
            "django": django.get_version(),
            "rendered": len(payload["cases"]),
            "status": "passed",
        },
        sort_keys=True,
    )
)
