#!/usr/bin/env python3
"""Assemble the two Pine scripts from one shared core so indicator and strategy can never drift.

  python3 tools/build_pine.py          -> writes pine/nss_indicator.pine and pine/nss_strategy.pine
  python3 tools/build_pine.py --check  -> exit 1 if the committed outputs are stale
"""
import pathlib, sys

ROOT = pathlib.Path(__file__).resolve().parent.parent / "pine"
core = (ROOT / "_core.pine.part").read_text()
outputs = {
    "nss_indicator.pine": (ROOT / "_indicator_head.pine.part").read_text() + core + (ROOT / "_indicator_tail.pine.part").read_text(),
    "nss_strategy.pine": (ROOT / "_strategy_head.pine.part").read_text() + core + (ROOT / "_strategy_tail.pine.part").read_text(),
}

def lint(name, text):
    """Cheap structural checks; the real compiler is TradingView's Pine Editor."""
    problems = []
    code = "\n".join(l.split("//")[0] for l in text.splitlines())   # strip comments (no // inside Pine string literals here)
    for ch_open, ch_close in ("()", "[]", "{}"):
        if code.count(ch_open) != code.count(ch_close):
            problems.append(f"unbalanced {ch_open}{ch_close}: {code.count(ch_open)} vs {code.count(ch_close)}")
    if not text.startswith("//@version=5"):
        problems.append("missing //@version=5 on line 1")
    for i, line in enumerate(text.splitlines(), 1):
        if "\t" in line:
            problems.append(f"line {i}: tab character (Pine wants 4 spaces)")
        stripped = line.rstrip()
        if stripped.endswith(("and", "or", "+", "-", "*", "/", ",")) and not stripped.lstrip().startswith("//"):
            problems.append(f"line {i}: dangling operator at end of line")
    return problems

if __name__ == "__main__":
    check = "--check" in sys.argv
    bad = False
    for name, text in outputs.items():
        for p in lint(name, text):
            print(f"{name}: {p}"); bad = True
        path = ROOT / name
        if check:
            if not path.exists() or path.read_text() != text:
                print(f"{name}: STALE, run tools/build_pine.py"); bad = True
        else:
            path.write_text(text)
            print(f"wrote {path.relative_to(ROOT.parent)} ({len(text.splitlines())} lines)")
    sys.exit(1 if bad else 0)
