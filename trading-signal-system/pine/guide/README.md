# Visual guide — where things are in TradingView

These four images are **schematic drawings** of TradingView's layout, not screenshots.
This cloud session's network policy blocks tradingview.com, so a real screenshot was
not possible. The positions and labels match TradingView's desktop web layout as of
2026; if your screen differs (mobile app, a very narrow window), the names in the
legends are what to search for.

| Figure | File | Shows |
|---|---|---|
| 1 | `fig1_chart_layout.png` | The chart screen: timeframe button, symbol box, bottom tabs (Pine Editor, Strategy Tester, Trading Panel), Alert button |
| 2 | `fig2_pine_editor.png` | Pine Editor: Open ▾ → New indicator / New strategy, code area, Save, Add to chart, error console |
| 3 | `fig3_paper_trading.png` | Trading Panel → Paper Trading → Connect, then gear → reset balance to 50000 |
| 4 | `fig4_alerts.png` | Alert dialog: condition = NSS, "NSS any long setup", Once per bar close, Create |

Regenerate with `python3 tools/draw_guide.py` from inside this folder.

## The sequence, with figure references

1. **Fig 1 ①** Timeframe must be `1D`. **Fig 1 ②** Any NSE stock.
2. **Fig 1 ③** Click Pine Editor. **Fig 2 ①②** Open ▾ → New indicator. **Fig 2 ③** Paste `../nss_indicator.pine`. **Fig 2 ④** Save as NSS. **Fig 2 ⑤** Add to chart.
3. **Fig 2 ⑥** If the console shows red text, copy it to Claude with the line number.
4. Repeat step 2 with **New strategy** and `../nss_strategy.pine`, name NSS-ST. **Fig 1 ⑤** Strategy Tester shows results.
5. **Fig 1 ④ → Fig 3 ①②** Trading Panel → Paper Trading → Connect → gear → balance 50000.
6. **Fig 1 ⑥ → Fig 4 ①–④** Create one alert per stock you watch, "Once per bar close".
