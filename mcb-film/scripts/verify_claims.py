#!/usr/bin/env python3
"""verify_claims.py: each callout id and ui key in plan/copy.json maps to a row in plan/spec_table.md."""
import json, re, sys
copy = json.load(open("plan/copy.json")); spec = open("plan/spec_table.md").read()
fails = []
for cid in copy["callouts"]:
    if not re.search(r"`" + re.escape(cid) + r"`", spec): fails.append(f"callout id {cid!r} has no spec_table row")
for k in copy["ui"]:
    if f"ui.{k}" not in spec: fails.append(f"ui key {k!r} has no spec_table row")
for k in copy["voice"]:
    if f"voice.{k}" not in spec: fails.append(f"voice key {k!r} has no spec_table row")
for x in fails: print("  FAIL:", x)
print(f"checked {len(copy['callouts'])} callouts, {len(copy['ui'])} ui keys, {len(copy['voice'])} voice keys")
print("verify_claims:", "FAIL" if fails else "PASS"); sys.exit(1 if fails else 0)
