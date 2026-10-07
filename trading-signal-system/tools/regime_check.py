#!/usr/bin/env python3
"""Spec §3.1 regime filter on a JSON file of daily bars {"c":[...],"h":[...],"l":[...]} (oldest -> newest).

Usage: python3 regime_check.py bars.json
Prints EMA20/EMA50, EMA50 slope over 10 bars, Wilder ADX(14)/+DI/-DI, ATR(14) and the regime verdict.
Pure Python, no dependencies. Same formulas the Pine Script will use (ta.ema, ta.rma-based ta.dmi/ta.atr).
"""
import json, sys

def ema(x, n):
    k = 2 / (n + 1); e = [x[0]]
    for v in x[1:]:
        e.append(v * k + e[-1] * (1 - k))
    return e

def rma(x, n):
    r = [sum(x[:n]) / n]
    for v in x[n:]:
        r.append((r[-1] * (n - 1) + v) / n)
    return r

def regime(c, h, l, ema_len=50, slope_bars=10, adx_len=14):
    e50 = ema(c, ema_len); e20 = ema(c, 20)
    tr, pdm, ndm = [], [], []
    for i in range(1, len(c)):
        tr.append(max(h[i] - l[i], abs(h[i] - c[i - 1]), abs(l[i] - c[i - 1])))
        up = h[i] - h[i - 1]; dn = l[i - 1] - l[i]
        pdm.append(up if up > dn and up > 0 else 0)
        ndm.append(dn if dn > up and dn > 0 else 0)
    atr = rma(tr, adx_len); p = rma(pdm, adx_len); n = rma(ndm, adx_len)
    pdi = [100 * a / b for a, b in zip(p, atr)]
    ndi = [100 * a / b for a, b in zip(n, atr)]
    dx = [100 * abs(a - b) / (a + b) if (a + b) else 0 for a, b in zip(pdi, ndi)]
    adx = rma(dx, adx_len)
    on = c[-1] > e50[-1] and e50[-1] > e50[-1 - slope_bars]
    return dict(close=c[-1], ema20=e20[-1], ema50=e50[-1], ema50_prev=e50[-1 - slope_bars],
                adx=adx[-1], pdi=pdi[-1], ndi=ndi[-1], atr=atr[-1], regime_on=on)

if __name__ == "__main__":
    d = json.load(open(sys.argv[1]))
    c, h, l = d["c"], d["h"], d["l"]
    assert len(c) == len(h) == len(l) >= 80, "need >= 80 aligned bars"
    r = regime(c, h, l)
    print(f"close {r['close']:.2f}  EMA20 {r['ema20']:.2f}  EMA50 {r['ema50']:.2f} (10 bars ago {r['ema50_prev']:.2f}, slope {'UP' if r['ema50']>r['ema50_prev'] else 'DOWN'})")
    print(f"ADX14 {r['adx']:.1f}  +DI {r['pdi']:.1f}  -DI {r['ndi']:.1f}  ATR14 {r['atr']:.0f} ({100*r['atr']/r['close']:.2f}%)")
    print("REGIME:", "ON" if r["regime_on"] else "OFF -> no new longs (spec 3.1)")
