# Pine Script setup — where to paste, what to set

Two scripts, both Pine v5, both generated from one shared core by `tools/build_pine.py`.
Never edit `nss_indicator.pine` or `nss_strategy.pine` by hand; edit the `_*.pine.part`
files and rebuild, or the indicator and the strategy will drift apart.

| File | Purpose |
|---|---|
| `nss_indicator.pine` | Marks setups on the chart, draws entry / stop / target lines, shows the confluence table, fires alerts. |
| `nss_strategy.pine` | Identical logic wired into `strategy()` for the Strategy Tester (Phase 3 backtest). |

## Paste the indicator (5 minutes)

1. Open TradingView, any **NSE stock**, set the timeframe to **1D**. The scripts refuse to signal on any other timeframe.
2. Bottom panel → **Pine Editor** → **Open** → **New indicator**. Delete the template text.
3. Paste the full contents of `nss_indicator.pine`. Click **Save** (name it NSS), then **Add to chart**.
4. If the editor shows a red error, copy the exact line and message back to me. I cannot compile Pine outside TradingView.
5. Open the gear icon on the indicator and set:

| Setting | Value for paper trading | Note |
|---|---|---|
| Paper capital (INR) | 50000 | Matches the TradingView Paper Trading balance you will set. Not ₹700, see spec §0.3. |
| Risk per trade % | 1.0 | MED-confidence signals automatically use half. |
| Max position size % | 25 | |
| Regime index | NSE:NIFTY | |
| Volatility index | NSE:INDIAVIX | |
| VIX cap | 20 | |
| Macro veto dates | update monthly | I pull RBI / CPI / FOMC / Budget dates from the economic calendar and give you the string. |
| Veto window | 14 | Calendar days ≈ 10 trading days. |
| Earnings veto | on | Uses TradingView's earnings dates for the stock. |
| Strategies A / B / C | all on | Turn one off to study the others. |
| Minimum confluence score | 6 | 6 = MED and HIGH show; 8 = HIGH only. |

6. **Read the table** (top right). Red "Regime OFF" or a news veto means no signal can fire. Grey circles under bars are setups that scored LOW or could not be sized: NO TRADE by rule.

## Set up alerts

Right-click the chart → **Add alert** → Condition: **NSS** → pick **NSS any long setup** (or one strategy) → Options **Once per bar close** → create. For the full text (entry, stop, targets, qty) choose condition **Any alert() function call** instead. Alerts fire at 3:30 pm IST when the daily bar closes; the order goes in next morning (see HANDOFF "trade timing").

## Paste the strategy (for the backtest)

1. Pine Editor → **New strategy** → paste `nss_strategy.pine` → Save → Add to chart.
2. Open **Strategy Tester** (bottom panel). Properties tab: initial capital 50000, commission 0.33% per order (already set in code), slippage 0 (slippage is inside the commission figure), **order size: contracts, 1** (the script sizes each trade itself).
3. Set the date range in **Deep Backtesting** to 2023-01-01 → today so you get the full two years plus.
4. Run on each Nifty 50 stock in turn and export: Strategy Tester → **List of trades** → export CSV. Phase 3 aggregates these. One stock per run is a TradingView limitation, not a choice.

## Known limitations, stated up front

- **One chart = one symbol.** Pine cannot cap you at 3 open positions across stocks. The Python engine (Phase 4) applies the portfolio rules; the Strategy Tester shows per-stock results only.
- **Flat DP charge (~₹18 per sell) is not modelled** in Pine. Percent commission is set at 0.33% per side. Python adds the flat fee.
- **Stop and target on the same bar.** When a bar's range covers both, TradingView decides the fill order from its intrabar assumption. Python mirrors the pessimistic case (stop first). Expect small exit differences; entries must match exactly.
- **Gap fills.** A buy stop that gaps over the trigger fills at the open; stop and targets stay at the pre-computed levels, so R is slightly off on those trades. Same in Python.
- **Strategy C entry** is a limit at the signal close that fills if the next day's low touches it (fill at min(open, limit)). The original "skip if gap up > 1%" rule was dropped because Pine cannot cancel an order intrabar; spec §4C updated.
- **Macro dates are an input string.** Pine has no economic calendar. For the backtest period the Python engine applies the real dates from the calendar; Pine runs with whatever is in the input, so Pine-vs-Python comparisons use a flag that turns the macro veto off on both sides.
