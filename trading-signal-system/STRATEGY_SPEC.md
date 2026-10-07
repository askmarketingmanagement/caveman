# STRATEGY_SPEC.md — Phase 1 (awaiting approval)

Status: **DRAFT — nothing here is live. No code until you approve.**
Date: 2026-10-07

---

## 0. Your setup (the four bracketed lines, filled in by me)

You asked me to pick these. Here is what I chose and why. Change any of them
and I will redo the spec; several strategy choices below follow directly from
these four lines.

| Item | Choice | Why |
|---|---|---|
| **MARKET** | NSE large-cap cash equity: the **Nifty 50 constituents**, traded as delivery (CNC). Nifty 50 index used as a regime filter only, not traded. | Liquid, tight spreads, 2+ years of free daily data (yfinance `.NS` tickers, TradingView), and SEBI-regulated. Index options were rejected on purpose, see 0.1. |
| **TRADING STYLE** | **Swing, 2–10 trading days, on daily charts**, with the weekly chart and the Nifty 50 index as higher-timeframe filters. Scan after 3:30 pm close, orders placed for next morning. | Daily bars backtest honestly with free data. You don't have to sit at a screen. Intraday 15-min on options was rejected, see 0.1. |
| **CAPITAL & MAX RISK** | **₹2,00,000 capital. Max 1% (₹2,000) risked per trade. Max 3 open positions. Max 25% of capital (₹50,000) in any one position. Max 3% total open risk.** | ₹2,000 of risk per trade is the smallest amount where a ~0.45% round-trip cost does not eat the edge. Below ~₹1L capital the fees dominate and I would tell you not to bother with this style. |
| **BROKER** | **Zerodha** (Kite web/app for execution; **Kite Connect** official API for the Phase 4 app). Fallback data source for end-of-day: yfinance. | Largest SEBI-registered retail broker, documented official API, zero brokerage on delivery. API pricing changes periodically; verify current Kite Connect and historical-data charges before Phase 4. |

### 0.1 Why NOT index options intraday (blunt version)

- I cannot backtest 2 years of option prices honestly with free data. yfinance has no NSE option history. Reconstructing option P&L from spot moves ignores theta and IV crush, which is exactly how retail option backtests lie.
- Weekly index options have STT on sell side, high bid-ask on far strikes, and a time decay clock. A 15-min rule system on them needs tick-level fills to be believable.
- If after this system is live you still want intraday options, we do it as a separate project with paid options data. Not as a bolt-on.

### 0.2 Hard consequence: the system is **long-only**

With ₹2L in a delivery account you cannot hold a short overnight in cash equity, and one lot of stock futures is typically ₹5–15 lakh notional. So every strategy below takes longs only. In a falling market the correct output is "NO TRADE", and the regime filter is what produces that. Expect long stretches of nothing. That is the design, not a bug.

---

## 1. Universe and data

- **Universe:** current Nifty 50 constituents, price between ₹50 and ₹10,000 (so ₹2,000 of risk can be sized in whole shares). Constituent changes handled by using the list as of backtest start plus additions; survivorship bias noted in the report.
- **Bars:** daily OHLCV, NSE session. Signals computed on the **closed** daily bar. No look-ahead: a signal on day D is executed on day D+1.
- **Entry execution:** buy stop (SL-M in Kite) placed pre-market on D+1 at the trigger price, valid for that day only. If not triggered by close, the signal expires.
- **Higher timeframes:** weekly EMA slope, and Nifty 50 index daily close vs its 50-EMA.

## 2. Costs modelled in every backtest (Zerodha CNC, approximate, verify)

| Item | Buy side | Sell side |
|---|---|---|
| Brokerage | ₹0 | ₹0 |
| STT | 0.10% | 0.10% |
| Exchange + SEBI charges + GST on them | ~0.004% | ~0.004% |
| Stamp duty | 0.015% | — |
| DP charge | — | ~₹15.34 + GST per scrip |
| **Slippage assumption** | 0.10% | 0.10% |
| **Total modelled round trip** | **≈ 0.45% of notional + ~₹18** | |

On a trade with a 3% stop, costs are ~15% of 1R. This is why I will not accept a strategy whose edge is under ~0.2R per trade after costs; that is inside the noise of the cost assumptions.

## 3. Shared rules (apply to all three candidates)

### 3.1 Regime filter (market)
- **Nifty 50 index close > its 50-day EMA**, and the 50-EMA is above its value 10 days ago. Otherwise: **NO TRADE**, for every strategy.
- **India VIX > 20** on the signal day → NO TRADE (abnormal volatility).

### 3.2 News filter
NO new entries if any of the following falls inside the expected holding window (signal day + 10 trading days):
- RBI Monetary Policy Committee decision day
- India CPI release (around the 12th of each month)
- US FOMC decision day
- Union Budget (1 Feb) and the two sessions after
- The stock's own earnings date (and the session after)
- Any day NSE has announced a special or shortened session
Open positions are **not** force-closed for news; the stop handles that. The daily routine in Phase 5 will check these dates.

### 3.3 Position sizing
```
risk_rupees   = min(1% × capital, remaining open-risk budget)
stop_distance = entry − stop_loss          (in ₹ per share)
qty           = floor(risk_rupees / stop_distance)
qty           = min(qty, floor(25% × capital / entry))
if qty == 0 → NO TRADE (stock too expensive for the risk budget)
```

### 3.4 Confidence score (shown on every signal)
Five components, each scored 0/1/2. Total 0–10.

| Component | 2 points | 1 point | 0 points |
|---|---|---|---|
| Trend | Close > 20-EMA > 50-EMA, ADX(14) > 25 | Close > 50-EMA, ADX 20–25 | Else |
| Momentum | RSI(14) rising, in strategy's preferred band | RSI flat in band | RSI falling or out of band |
| Volume | Signal-bar volume > 1.5 × 20-day average | 1.0–1.5× | < 1.0× |
| S/R | Entry within 1 ATR of a tested level (20-day high/low, 50-EMA) | Within 2 ATR | Further |
| HTF agreement | Weekly close > weekly 20-EMA and Nifty regime ON | One of the two | Neither |

- **High** = 8–10 → tradable at full 1% risk
- **Med** = 6–7 → tradable at 0.5% risk
- **Low** = 0–5 → **NO TRADE**
- Any Low result, any regime/news veto, or conflicting signals from two strategies on the same stock = NO TRADE.

### 3.5 Universal exits
- Hard stop-loss order resting with the broker from the moment of entry. **No stop = no trade.**
- Time stop: close at market on the 10th trading day after entry if neither target nor stop has hit.
- Stop never moves down. It can move up only by the rules in each strategy.

---

## 4. Candidate strategies

### Strategy A — Trend pullback to the 20-EMA ("buy the dip in an uptrend")

**Thesis / why it might have an edge:** Large caps in a confirmed uptrend tend to get bought at the first moving average after a 3–6 day pullback, because institutional flow accumulates on weakness. The edge, if any, comes from the regime + ADX filter that keeps you out of chop, and from entering only on the resumption bar rather than catching the knife.

**Setup (all on day D close):**
1. Regime filter ON (3.1), no news veto (3.2).
2. Stock: close > 50-EMA, 50-EMA rising (above its value 10 bars ago), ADX(14) ≥ 20.
3. Pullback: within the last 5 bars, low touched or came within 0.5 × ATR(14) of the 20-EMA, and the 20-EMA was never broken on a closing basis by more than 1 ATR.
4. RSI(14) between 40 and 60 (not oversold, not extended).
5. Day D is a reversal bar: close > open AND close in the upper 50% of the day's range.

**Entry (day D+1):** buy stop at D's high + 0.05% (one tick above). Expires at close if untouched.

**Stop-loss:** lowest low of the pullback (the swing low) minus 0.25 × ATR(14). Reject the trade if the stop is more than 4% or less than 1% from entry.

**Targets:** T1 = entry + 1.5R (sell half). T2 = entry + 3R, or trailing: after T1, exit remaining on first daily close below the 20-EMA.

**Expected hold:** 3–8 trading days. **Design R:R:** 1.5R first leg, 3R second leg, blended target ≈ 2.25R on winners.

**Invalidation:** close below the 20-EMA before the entry triggers (cancel order); Nifty regime flips OFF (cancel pending orders, keep stops on open positions).

---

### Strategy B — Range breakout with volume + volatility contraction

**Thesis / why it might have an edge:** When a large cap's daily range contracts for 2–3 weeks and then closes above its 20-day high on expanding volume, it is often the start of a multi-day repricing (earnings re-rating, index flow, sector rotation). The volatility-contraction and volume conditions are what separate a real breakout from a random poke above the range. Breakouts have low win rates; the edge is in the average winner being several times the average loser. If the backtest shows a win rate under ~35% with a profit factor under 1.3, this one gets killed.

**Setup (day D close):**
1. Regime filter ON, no news veto.
2. Volatility contraction: ATR(10) < 0.8 × ATR(50), OR Bollinger Band width (20, 2) is at its lowest in 60 bars.
3. Breakout: close > highest high of the prior 20 bars (excluding D).
4. Volume: D's volume ≥ 1.5 × 20-day average volume.
5. Not extended: close is less than 1.5 × ATR(14) above the breakout level (no chasing gaps).

**Entry (day D+1):** buy stop at D's high + 1 tick. Expires at close if untouched.

**Stop-loss:** max(D's low, breakout level − 0.5 × ATR(14)), minus 1 tick. Reject if stop > 5% or < 1% from entry.

**Targets:** T1 = entry + 2R (sell half). Remainder: trail stop at the lowest low of the last 3 bars (Chandelier-style), or 10-day time stop.

**Expected hold:** 2–10 trading days. **Design R:R:** 2R first leg, open-ended second leg.

**Invalidation:** close back inside the range (below the 20-day high) on D+1 or D+2 → exit at next open even if the stop has not hit. Volume on the breakout bar revised below 1.2× on the final NSE print → do not enter.

---

### Strategy C — Mean reversion at support in a long-term uptrend (short hold)

**Thesis / why it might have an edge:** Short, sharp 2–4 day drops in a stock that is above its 200-EMA tend to snap back toward the 10-EMA. This is a high-win-rate, low-R:R pattern. It is included because it is the one of the three that tends to work in slow, grinding markets where A and B produce nothing. The danger is the occasional large loss, so the stop is tighter than most mean-reversion systems and the hold is capped at 5 days.

**Setup (day D close):**
1. Regime filter ON, no news veto.
2. Stock close > 200-EMA (long-term uptrend intact).
3. Oversold: RSI(2) < 10 AND close < 20-EMA, AND close is within 1 ATR(14) of the 50-EMA (the "support" being tested).
4. Not in free-fall: D's close is above D's low by at least 30% of the day's range (some buying showed up), and the 3-day decline is less than 8%.

**Entry (day D+1):** buy limit at D's close (not a stop; we want the fill near the low), valid for the day. If the stock gaps up more than 1% at open, skip.

**Stop-loss:** D's low − 0.5 × ATR(14). Reject if stop > 3.5% from entry.

**Targets:** single exit at the first daily close above the 10-EMA, OR RSI(2) > 70, OR 5-trading-day time stop, whichever first.

**Expected hold:** 1–5 trading days. **Design R:R:** roughly 1:1 to 1.3:1; the strategy needs a ≥ 60% win rate after costs to be worth running. If the backtest shows under 58%, kill it.

**Invalidation:** earnings inside the next 5 sessions; Nifty regime OFF; stock closes below the 50-EMA by more than 1 ATR.

---

## 5. Conflict and priority rules

- Same stock, two strategies firing the same day → NO TRADE on that stock (indicators conflict by definition; A/C want pullbacks, B wants expansion).
- More qualifying signals than open slots → rank by confidence score, then by lowest stop distance in %. Take the top ones.
- A and B get priority over C when slots are limited, because they have the better R:R.

## 6. Backtest plan (Phase 3 preview, so you can object now)

- **Period:** at least 2 years, target 1 Jan 2023 → 30 Sep 2026, daily bars, all Nifty 50 names.
- **Stats reported per strategy and combined:** trades, win rate, avg win, avg loss, payoff ratio, profit factor, max drawdown (₹ and %), expectancy per trade in R, longest losing streak, exposure %.
- **Regime breakdown:** trending (Nifty ADX(14) > 25) vs ranging (≤ 25), and bull (regime ON) vs filtered-out periods to prove the filter earns its keep.
- **Day-of-week breakdown** instead of time-of-day, because entries are at the next open. If you want an intraday time-of-day split, we need 15-min data and a different execution model; say so.
- **Costs** per section 2, applied to every trade.
- **Kill criteria, decided now so I can't move them later:**
  - Profit factor < 1.25 after costs → kill
  - Fewer than 40 trades over 2 years → "insufficient evidence", not "works"
  - Max drawdown > 15% of capital → kill or cut risk to 0.5%
  - Edge disappears when slippage is doubled → kill (too fragile)
- **Tweak budget:** 2 rounds max. Each tweak must be a single parameter with a stated reason, tested on the full period. No per-stock parameters.

## 7. What I need from you before Phase 2

Reply with any of these, or just "approved":

1. Accept or change the four setup lines in section 0. The capital figure in particular drives whether this is worth doing.
2. Long-only acceptable? (Section 0.2.) If you want shorts we need a different instrument and the spec changes.
3. Which candidates to build: all three, or drop one now. My recommendation: build A and B into the Pine indicator and strategy, backtest C separately, because C's limit-entry logic behaves differently in the Strategy Tester.
4. Confirm Zerodha. If it's another broker the Phase 4 API layer changes but nothing else does.
5. Confirm you want Pine Script **v5** specifically. TradingView's current version is v6; v5 still compiles, but new scripts default to v6. I will write v5 as asked unless you say otherwise.

Nothing moves to Phase 2 until I have your answer.
