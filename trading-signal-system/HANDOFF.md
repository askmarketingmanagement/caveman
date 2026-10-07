# HANDOFF.md — trading signal system

Re-read this file at the start of every session. Update it whenever a decision
is made, a phase changes, or the user gives an instruction.

Last updated: 2026-10-07

## Current phase

**Phase 1 — Strategy spec written, AWAITING USER APPROVAL.**
Do not start Phase 2 (Pine Script) until the user approves `STRATEGY_SPEC.md`
or asks for changes.

## Phase checklist

| Phase | Deliverable | Status |
|---|---|---|
| 1 | `STRATEGY_SPEC.md` | Drafted, awaiting approval |
| 2 | Pine v5 indicator + strategy(), paste instructions | Not started |
| 3 | `BACKTEST_REPORT.md` with costs, regime + day-of-week breakdown, keep/kill/tweak | Not started |
| 4 | Python companion app: data pull, signal engine matching Pine, verification script, news-risk check, local dashboard, trade journal | Not started |
| 5 | Daily operating routine in the fixed signal format | Not started |

## Decisions so far

1. **Setup lines filled in by Claude** (user delegated the choice):
   - Market: Nifty 50 constituent stocks, cash/delivery. Nifty 50 index as regime filter only.
   - Style: swing, 2–10 trading days, daily bars, next-open execution. Weekly + Nifty index as higher-timeframe filters.
   - Capital ₹2,00,000; 1% (₹2,000) max risk per trade; max 3 positions; max 25% capital per position; max 3% total open risk.
   - Broker: Zerodha (Kite Connect official API for Phase 4; yfinance as EOD fallback).
2. **Long-only.** Delivery account cannot hold overnight shorts; stock futures lots too large for ₹2L. Regime filter produces "NO TRADE" in down markets.
3. **Index options intraday rejected** for lack of honest backtest data. Can be a separate later project.
4. **Three candidates:** A trend pullback to 20-EMA, B volatility-contraction breakout with volume, C short-hold mean reversion at 50-EMA in long-term uptrend. Recommendation: build A+B first in Pine, test C separately.
5. **Costs modelled:** ≈0.45% round trip (STT 0.1%/side, ~0.004% charges, 0.015% stamp, ₹15.34 DP, 0.1% slippage per side). Verify Zerodha charges before Phase 3.
6. **Kill criteria fixed in advance** (spec §6): PF < 1.25, < 40 trades, max DD > 15%, or edge dies at 2× slippage. Tweak budget: 2 rounds, one parameter each.
7. **Regime breakdown** by Nifty ADX > 25 vs ≤ 25. **Day-of-week** replaces time-of-day because entries are at the next open.
8. **Files live in `trading-signal-system/`** inside this repo (the caveman plugin repo). Kept in a subfolder so the repo's own README/INSTALL/CLAUDE docs are untouched.

## Open questions for the user (from spec §7)

- Accept/change the four setup lines, especially capital.
- Long-only OK?
- Build all three strategies or drop one now?
- Confirm Zerodha.
- Pine v5 (as asked) vs v6 (TradingView's current default).

## User's standing instructions (verbatim intent)

- Never claim certainty; every signal has Low/Med/High confidence with reasons. Low = NO TRADE.
- Every signal: direction, entry zone, stop-loss, target(s), hold time, R:R, invalidation. No stop = no signal.
- Default NO TRADE on indicator conflict, scheduled major news inside holding window (RBI, CPI, Fed, earnings, budget), or abnormal volatility.
- Nothing goes live without 2+ years backtest AND 3+ weeks paper trading. Honest stats: win rate, avg win vs avg loss, max DD, profit factor, trade count. If no edge, say so.
- No TradingView scraping. Pine Script inside TradingView; broker official API or legitimate sources offline.
- Claude is not a financial advisor; user makes every final call.
- Finish and verify each phase before the next. Verification by scripts, not by eye.
- Do thorough analysis up front rather than one bug at a time. If something fails twice, root-cause before retrying.
- Keep this HANDOFF.md current.
- Phase 5 signal format (exact):
  ```
  INSTRUMENT | DIRECTION | CONFIDENCE
  Entry: ___  Stop-loss: ___  Target 1/2: ___  R:R ___
  Hold for: ___   Invalidation: ___
  Why (chart): ___
  Why (news/context): ___
  Position size for my risk limit: ___
  Or: "NO TRADE — reason: ___"
  ```

## Open issues / risks

- Zerodha Kite Connect and historical-data API pricing changes; confirm before Phase 4. yfinance EOD is the free fallback and is sufficient for daily-bar signals.
- Survivorship bias: backtesting on today's Nifty 50 list overstates results. Report will flag it and, if feasible, use the constituent list as of 2023.
- Pine strategy() fills and the Python engine must agree; Phase 4 includes a comparison script. Known divergence sources: next-open vs stop-order fills, tick rounding, ATR seeding.

## Next action

Wait for the user's answer to spec §7. On "approved": start Phase 2, Pine v5 indicator first, then strategy(), then paste instructions, all under `trading-signal-system/pine/`.
