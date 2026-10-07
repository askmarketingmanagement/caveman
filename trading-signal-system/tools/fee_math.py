#!/usr/bin/env python3
"""Cost-vs-risk maths for Zerodha CNC (delivery) swing trades. Usage: python3 fee_math.py [capital] [stock_price] [stop_pct]

Charges modelled (verify against Zerodha's brokerage calculator; they change):
  brokerage 0, STT 0.1% buy + 0.1% sell, exchange+SEBI ~0.004%/side, stamp 0.015% buy,
  DP charge Rs 15.34 + 18% GST per sell scrip, slippage 0.1%/side assumed.
"""
import sys, math

DP = 15.34 * 1.18
PCT_ROUND_TRIP = 0.001 * 2 + 0.00004 * 2 + 0.00015 + 0.001 * 2   # ~0.4585%

def trade(capital, price, stop_pct, risk_pct=0.01, max_pos_pct=0.25):
    risk_rs = capital * risk_pct
    stop_rs = price * stop_pct
    qty = math.floor(risk_rs / stop_rs)
    qty = min(qty, math.floor(capital * max_pos_pct / price))
    if qty == 0:
        return None
    notional = qty * price
    one_r = qty * stop_rs
    cost = notional * PCT_ROUND_TRIP + DP
    return dict(qty=qty, notional=notional, one_r=one_r, cost=cost, cost_in_r=cost / one_r,
                net_2r_win=2 * one_r - cost, net_1r_loss=-(one_r + cost))

def breakeven_wr(win, loss):
    return -loss / (win - loss)

if __name__ == "__main__":
    cap = float(sys.argv[1]) if len(sys.argv) > 1 else 700
    price = float(sys.argv[2]) if len(sys.argv) > 2 else 175.64   # NSE:TATASTEEL close 2026-10-07
    stop = float(sys.argv[3]) if len(sys.argv) > 3 else 0.03
    print(f"capital Rs {cap:,.0f}, stock Rs {price}, stop {stop:.0%}, 1% risk rule, 25% max position")
    t = trade(cap, price, stop)
    if t is None:
        print("  -> qty = 0. Cannot size a position under the 1% rule. NO TRADE, always.")
    else:
        print(f"  qty {t['qty']}  notional Rs {t['notional']:.0f}  1R = Rs {t['one_r']:.2f}  round-trip cost Rs {t['cost']:.2f} = {t['cost_in_r']:.2f}R")
        print(f"  2R winner nets Rs {t['net_2r_win']:+.2f}; 1R loser nets Rs {t['net_1r_loss']:+.2f}; breakeven win rate {breakeven_wr(t['net_2r_win'], t['net_1r_loss']):.0%}" if t['net_2r_win'] > 0 else f"  2R winner nets Rs {t['net_2r_win']:+.2f}  <- a WIN loses money")
    print("\nAll-in (ignore the 1% rule, buy max shares):")
    qty = math.floor(cap / price); notional = qty * price; one_r = notional * stop; cost = notional * PCT_ROUND_TRIP + DP
    win, loss = 2 * one_r - cost, -(one_r + cost)
    print(f"  qty {qty}  notional Rs {notional:.0f}  risk/trade {one_r/cap:.1%} of capital  cost {cost/one_r:.2f}R")
    print(f"  2R winner nets Rs {win:+.2f}; 1R loser nets Rs {loss:+.2f}; breakeven win rate {breakeven_wr(win, loss):.0%}")
    print("\nMinimum capital so costs <= 0.20R at 1% risk, 3% stop (cost = 0.4585%*33.3R + DP):")
    r_needed = DP / (0.20 - PCT_ROUND_TRIP / stop)
    print(f"  1R >= Rs {r_needed:.0f}  ->  capital >= Rs {r_needed/0.01:,.0f}")
