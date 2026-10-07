# HANDOFF.md — trading signal system

Re-read this file at the start of every session. Update it whenever a decision
is made, a phase changes, or the user gives an instruction.

Last updated: 2026-10-07 (session 2)

## Current phase

**Phase 2 — Pine scripts written, awaiting user's compile result. (Phase 1 approved with "go" on 2026-10-07.)**

Historical note from Phase 1:
User said they use **Olymp Trade**. Olymp Trade is on the RBI Alert List of
entities not authorised to deal in forex / run electronic trading platforms
in India, is not SEBI-registered, and offers fixed-time (binary-style) trades
that have no stop-loss, no target and a fixed payout. That conflicts with the
user's own rule 5 (SEBI-regulated only) and rule 2 (no stop-loss = no signal).
Claude has told the user this and asked them to choose a SEBI-registered
broker (Zerodha / Upstox / Angel One / Groww / etc.) before Phase 2.
Do NOT build signals for Olymp Trade or any fixed-time-trade product under this
spec. The spec is otherwise unchanged and still awaits approval.

## Phase checklist

| Phase | Deliverable | Status |
|---|---|---|
| 1 | `STRATEGY_SPEC.md` | **Approved** ("go", 2026-10-07) |
| 2 | Pine v5 indicator + strategy(), paste instructions | Written: `pine/nss_indicator.pine`, `pine/nss_strategy.pine`, `pine/PINE_SETUP.md`. Generated from `pine/_*.pine.part` by `tools/build_pine.py` (run `--check` in any verification). **Not yet compiled in TradingView** — user must paste and report errors. |
| 3 | `BACKTEST_REPORT.md` with costs, regime + day-of-week breakdown, keep/kill/tweak | Not started |
| 4 | Python companion app: data pull, signal engine matching Pine, verification script, news-risk check, local dashboard, trade journal | Started early: `tools/regime_check.py`, `journal/` |
| 5 | Daily operating routine in the fixed signal format | Not started |

## Decisions so far

1. **Setup lines filled in by Claude** (user delegated the choice):
   - Market: Nifty 50 constituent stocks, cash/delivery. Nifty 50 index as regime filter only.
   - Style: swing, 2–10 trading days, daily bars, next-open execution. Weekly + Nifty index as higher-timeframe filters.
   - Capital ₹2,00,000 (PAPER; real capital is ₹700, see §0.3); 1% max risk per trade; max 3 positions; max 25% capital per position; max 3% total open risk.
   - Broker: Zerodha (Kite Connect official API for Phase 4; yfinance as EOD fallback).
2. **Long-only.** Delivery account cannot hold overnight shorts; stock futures lots too large for ₹2L. Regime filter produces "NO TRADE" in down markets.
3. **Index options intraday rejected** for lack of honest backtest data. Can be a separate later project.
4. **Three candidates:** A trend pullback to 20-EMA, B volatility-contraction breakout with volume, C short-hold mean reversion at 50-EMA in long-term uptrend. Recommendation: build A+B first in Pine, test C separately.
5. **Costs modelled:** ≈0.45% round trip (STT 0.1%/side, ~0.004% charges, 0.015% stamp, ₹15.34 DP, 0.1% slippage per side). Verify Zerodha charges before Phase 3.
6. **Kill criteria fixed in advance** (spec §6): PF < 1.25, < 40 trades, max DD > 15%, or edge dies at 2× slippage. Tweak budget: 2 rounds, one parameter each.
7. **Regime breakdown** by Nifty ADX > 25 vs ≤ 25. **Day-of-week** replaces time-of-day because entries are at the next open.
8. **Files live in `trading-signal-system/`** inside this repo (the caveman plugin repo). Kept in a subfolder so the repo's own README/INSTALL/CLAUDE docs are untouched.

## Session 2 update

User reaffirmed: has deposited ₹700 on Olymp Trade and intends to trade there.
Claude's position, communicated to user: will not build signals for Olymp
Trade (RBI Alert List, no stop-loss product, no verifiable data, user's own
rules 2/4/5 cannot be met). Under the user's 1% rule, ₹700 capital means ₹7
risk per trade, below the platform's minimum stake, so the system's honest
output there is NO TRADE every day. Offered path: build Phases 2–4 against
TradingView paper trading / a SEBI broker's free demo, which costs ₹0 and is
required by rule 4 anyway. Awaiting user's go-ahead.

User then said they will paper trade on Olymp Trade and asked for a live
position call "with the help of TradingView". Answered NO TRADE: no system
built or backtested yet (rule 4), no instrument/chart/timeframe given, no data
access from this session. Recommended TradingView Paper Trading over the Olymp
Trade demo (exchange data, SL/TP, trade log). Offered to start Phase 2 with
defaults (all three strategies, Pine v5, ₹2L paper sizing) on the word "go".

User offered TradingView access, then pointed at the **official TradingView
MCP server** (https://mcp.tradingview.com/mcp, OAuth 2.1, public beta, needs
Essential plan or above; ~100 tool calls/min). Decision: this is the approved,
ToS-compliant data path for Phase 5 chart checks and a candidate historical
data source for Phase 4 (alongside yfinance). No credentials are ever to be
shared with Claude. The `claude mcp add` command cannot complete OAuth in a
cloud session; user must add it as a connector at
https://claude.ai/customize/connectors and start a new session. Once present,
tools will appear as `mcp__mcp-tradingview__*` (verify name at session start).

TradingView connector is now live in-session (tools `mcp__Tradingview__mcp-tv-*`:
get-ohlcv, get-symbol-data(-batch), run-screener incl. market=india, economic/
earnings calendars, news, alerts, watchlists). Verified: NSE:NIFTY, NSE:INDIAVIX,
NSE:RELIANCE daily bars (933 bars since 2023-01-01 available, enough for the
2-year backtest). First live check done and logged in `journal/2026-10-07.md`:
regime OFF, RBI hiked to 5.50% today, NO TRADE. `tools/regime_check.py` is the
first verification script and the reference implementation of §3.1.

**User's real capital is ₹700** (not ₹2L). Spec §0.3 added: system is
unprofitable below ~₹30k because of the flat ₹18 DP charge; at ₹700 the 1% rule
sizes zero shares and an all-in trade needs a 76% win rate. Decision: all work
continues as PAPER TRADING on TradingView Paper Trading with a virtual balance;
no real-money sizing until capital ≥ ~₹30k. User asked for trade timing; the
spec's timing (close-of-day signal → next-open stop order → 2–10 day hold →
day-10 time stop) was explained. Still awaiting "go" for Phase 2.

## Phase 2 decisions (2026-10-07)
- Paper capital ₹50,000, 1% risk at HIGH, 0.5% at MED, 25% max position. Pine v5 as asked.
- All three strategies built. Conflict rule, confluence score, regime, VIX cap, macro-date and earnings vetoes all in the shared core.
- Shared-core build: one `_core.pine.part` → two scripts. Never hand-edit the generated `.pine` files.
- Execution model fixed for Pine AND Python: A/B buy-stop at high+tick valid next bar; C buy-limit at close valid next bar, fills if low <= limit at min(open, limit) (gap-skip rule dropped, spec §4C amended). Exits attached at entry time from trigger-based levels. Close-based exits fill next open. Time stops: A/B 10 bars, C 5 bars.
- Costs in Pine: 0.33%/side percent commission (STT+charges+slippage). Flat DP ~₹18/sell NOT in Pine; Python adds it.
- Pine limitations documented in `pine/PINE_SETUP.md` (per-symbol only, same-bar stop/target ambiguity, gap fills, macro dates as input string).

## 2026-10-07: user asked about currency pairs
Answer given: offshore forex (Olymp Trade, foreign brokers) = FEMA violation for
Indian residents. Onshore NSE/BSE currency F&O has required a declared underlying
exposure since RBI's circular took effect 3 May 2024; retail speculative volume fell
~87%; a review was reported under consideration in Nov 2025 but nothing confirmed.
So a retail speculator in India has no legal live venue for currency pairs today.
Paper trading FX on TradingView is fine and the three strategies port to daily FX
bars, but the primary system stays NSE cash equities. No spec change.

## What the TradingView connector can and cannot do (told to user 2026-10-07)
CAN: quotes, daily bars back to listing, screener (market=india, index filter works),
economic + earnings calendars, news, simple price alerts, watchlists.
CANNOT: see or control the user's chart, paste/compile Pine, read compile errors, run
the Strategy Tester, create indicator-based alerts. The Pine paste step is the user's.
Created watchlist "NSS Nifty 50" in the user's account (NIFTY, INDIAVIX + 50 names).
Universe saved to `data/universe_nifty50_2026-10-07.json`. User has no alerts yet.

## Open questions for the user (from spec §7)

- **Broker: user named Olymp Trade. Blocked until they pick a SEBI-registered broker or explicitly rewrite rule 5 (see Current phase).**

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

1. User pastes `pine/nss_indicator.pine` into Pine Editor on an NSE daily chart and reports any compile error (exact line + message). Fix in the `.part` files, rebuild.
2. Once both scripts compile: Phase 3. Pull 2023-01-01→today daily bars for all Nifty 50 names via the TradingView MCP (`get-ohlcv`, 933+ bars each), run the Python engine (to be written, must mirror the core), and have the user run the Strategy Tester on 5 names to cross-check entries. Write `BACKTEST_REPORT.md`.
