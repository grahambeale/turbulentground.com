#!/usr/bin/env python3
"""Read-only G1 record check. It does not authenticate the human decision."""

from datetime import datetime
from pathlib import Path
import hashlib
import json
import sys


ROOT = Path(__file__).resolve().parent
CHANGE = ROOT / "changes" / "clarify-survey-journey"


def block(reason):
    print("G1 BLOCKED: " + reason)
    raise SystemExit(1)


try:
    manifest_bytes = (CHANGE / "review-packet.json").read_bytes()
    manifest = json.loads(manifest_bytes)
    required = {
        "evidence-snapshot.md",
        "proposal.md",
        "specs/survey-journey-orientation/spec.md",
        "review.md",
    }
    if set(manifest["files"]) != required:
        block("review packet file list is incomplete or unexpected")
    for name, digest in manifest["files"].items():
        actual = hashlib.sha256((CHANGE / name).read_bytes()).hexdigest()
        if actual != digest:
            block("packet changed: " + name + "; revise and return to Graham")
    approval_path = CHANGE / "approval.json"
    if not approval_path.exists():
        block("Graham has not approved this specification; approval.json is absent")
    approval = json.loads(approval_path.read_text())
    if approval.get("status") != "approved" or approval.get("approver") != "Graham Beale":
        block("explicit Graham approval is required")
    for field in ("approved_at", "decision_quote", "decision_source", "review_answers", "airtable_review_notes_sha256"):
        if not isinstance(approval.get(field), str) or not approval[field].strip():
            block("missing human decision field: " + field)
    approved_at = datetime.fromisoformat(approval["approved_at"].replace("Z", "+00:00"))
    if approved_at.tzinfo is None:
        block("approval timestamp must include a timezone")
    packet_digest = hashlib.sha256(manifest_bytes).hexdigest()
    if approval.get("revision") != manifest["revision"] or approval.get("packet_sha256") != packet_digest:
        block("approval does not cover this exact review packet")
except (OSError, ValueError, KeyError, TypeError) as exc:
    block("missing or invalid record: " + str(exc))

print("G1 record checks PASS. Verify Graham's quoted decision at its source before design. This is not release approval.")
