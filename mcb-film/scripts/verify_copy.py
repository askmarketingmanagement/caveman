#!/usr/bin/env python3
"""verify_copy.py: every on-screen string lives in plan/copy.json; banned terms absent; no stray digits.
Checks (1) banned terms in copy.json values, filenames under plan/ stills/ shots/ gfx/ out/ and the Remotion source,
(2) digits in callouts (none allowed), (3) hard-coded string literals in gfx/remotion/src that are not copy.json values.
Prints PASS/FAIL. Exit 1 on FAIL."""
import json, os, re, sys, glob
BANNED = ["RealWear", "Arc 3", "Navigator", "Ari OS", "ATEX", "IP65", "IP66", "IP67", "MIL-STD", "accuracy", "%",
          "battery", "hours", "MP", "megapixel", "GB", "VR"]
if os.path.exists("INPUTS.md") and re.search(r"keep.*integrated VR", open("INPUTS.md").read(), re.I): BANNED.remove("VR")
def banned_in(text):
    hits = []
    for b in BANNED:
        pat = re.escape(b) if b == "%" else r"(?<![A-Za-z0-9])" + re.escape(b) + r"(?![A-Za-z0-9])"
        if re.search(pat, text, re.I): hits.append(b)
    return hits
copy = json.load(open("plan/copy.json"))
fails = []
def walk(o, path=""):
    if isinstance(o, dict):
        for k, v in o.items(): yield from walk(v, f"{path}.{k}")
    elif isinstance(o, list):
        for i, v in enumerate(o): yield from walk(v, f"{path}[{i}]")
    else: yield path, str(o)
strings = list(walk(copy))
for p, s in strings:
    h = banned_in(s)
    if h: fails.append(f"banned term {h} in copy.json{p}: {s!r}")
    if p.startswith(".callouts") and re.search(r"\d", s): fails.append(f"digit in callout copy.json{p}: {s!r}")
# filenames
for root in ["plan", "stills", "shots", "gfx", "out", "edit", "audio_work"]:
    for f in glob.glob(f"{root}/**/*", recursive=True):
        h = banned_in(os.path.basename(f))
        if h: fails.append(f"banned term {h} in filename {f}")
# remotion source literals
allowed = {s for _, s in strings}
src_files = glob.glob("gfx/remotion/src/**/*.tsx", recursive=True) + glob.glob("gfx/remotion/src/**/*.ts", recursive=True)
for f in src_files:
    txt = open(f).read()
    h = banned_in(txt)
    if h: fails.append(f"banned term {h} in {f}")
    # JSX text nodes with letters that are not copy values and not a known identifier
    for m in re.finditer(r">\s*([A-Za-z][^<>{}]{2,})\s*<", txt):
        lit = m.group(1).strip()
        if lit and lit not in allowed: fails.append(f"hard-coded JSX text {lit!r} in {f}")
if not src_files: print("note: no Remotion source yet (gfx/remotion/src); literal check skipped")
print(f"copy.json strings checked: {len(strings)}")
for x in fails: print("  FAIL:", x)
print("verify_copy:", "FAIL" if fails else "PASS"); sys.exit(1 if fails else 0)
