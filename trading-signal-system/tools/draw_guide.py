from PIL import Image, ImageDraw, ImageFont
import random

W, H = 1600, 900
BG, PANEL, BORDER, TXT, DIM = (19, 23, 34), (30, 34, 45), (54, 58, 72), (210, 214, 224), (140, 145, 160)
RED, GREEN, ORANGE, BLUE = (242, 54, 69), (8, 153, 129), (255, 152, 0), (41, 98, 255)

def font(sz, bold=False):
    for p in (["/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf"] if bold else ["/usr/share/fonts/truetype/dejavu/DejaVuSans.ttf"]):
        try: return ImageFont.truetype(p, sz)
        except Exception: pass
    return ImageFont.load_default()

F12, F14, F16, F18B, F22B, F28B = font(12), font(14), font(16), font(18, True), font(22, True), font(28, True)

def marker(d, xy, n, color=RED):
    x, y = xy
    d.ellipse([x-18, y-18, x+18, y+18], fill=color, outline=(255,255,255), width=3)
    d.text((x, y), str(n), fill=(255,255,255), font=F22B, anchor="mm")

def box(d, rect, color=RED, w=3):
    d.rectangle(rect, outline=color, width=w)

def tab(d, x, y, text, active=False, w=None):
    tw = d.textlength(text, font=F14) + 28 if w is None else w
    d.rectangle([x, y, x+tw, y+30], fill=(44, 48, 62) if active else PANEL, outline=BORDER)
    d.text((x+14, y+8), text, fill=TXT if active else DIM, font=F14)
    return x + tw + 6

def chart_frame(d, title):
    d.rectangle([0,0,W,H], fill=BG)
    # top toolbar
    d.rectangle([0,0,W,46], fill=PANEL, outline=BORDER)
    d.rectangle([12,8,220,38], fill=(44,48,62), outline=BORDER); d.text((24,15), "RELIANCE  ·  NSE", fill=TXT, font=F14)
    d.rectangle([232,8,290,38], fill=(44,48,62), outline=BORDER); d.text((248,15), "1D", fill=TXT, font=F14)
    d.rectangle([302,8,400,38], fill=(44,48,62), outline=BORDER); d.text((314,15), "Candles", fill=DIM, font=F14)
    d.rectangle([412,8,540,38], fill=(44,48,62), outline=BORDER); d.text((424,15), "Indicators", fill=TXT, font=F14)
    d.rectangle([552,8,640,38], fill=(44,48,62), outline=BORDER); d.text((564,15), "Alert", fill=TXT, font=F14)
    d.rectangle([652,8,740,38], fill=(44,48,62), outline=BORDER); d.text((664,15), "Replay", fill=DIM, font=F14)
    # left drawing toolbar
    d.rectangle([0,46,52,H-46], fill=PANEL, outline=BORDER)
    for i in range(10): d.rectangle([16, 70+i*44, 36, 90+i*44], outline=DIM)
    # right panel (watchlist)
    d.rectangle([W-300,46,W,H-46], fill=PANEL, outline=BORDER)
    d.text((W-288,58), "Watchlist", fill=TXT, font=F14)
    for i,s in enumerate(["NIFTY","RELIANCE","HDFCBANK","ITC","TATASTEEL","INFY"]):
        d.text((W-288, 90+i*26), s, fill=DIM, font=F12)
    # candles
    random.seed(7); x=90; p=440
    for i in range(70):
        o=p; c=p+random.uniform(-14,14); h=max(o,c)+random.uniform(1,8); l=min(o,c)-random.uniform(1,8)
        col = GREEN if c>=o else RED
        d.line([x,h,x,l], fill=col, width=1); d.rectangle([x-4,min(o,c),x+4,max(o,c)], fill=col)
        x+=17; p=c
    d.text((W-560, 60), title, fill=DIM, font=F12)

def footer(d, active=None, open_panel_h=0):
    y = H-46 - open_panel_h
    d.rectangle([52, y, W-300, y+34], fill=PANEL, outline=BORDER)
    x = 64
    for t in ["Stock Screener", "Pine Editor", "Strategy Tester", "Trading Panel"]:
        x = tab(d, x, y+2, t, active=(t==active))
    return y

# ---------- Figure 1: the chart, where everything lives
im = Image.new("RGB", (W,H)); d = ImageDraw.Draw(im)
chart_frame(d, "schematic of TradingView chart layout")
footer(d)
box(d, [228,4,294,42]); marker(d, (330,70), 1)
box(d, [8,4,224,42], ORANGE); marker(d, (120,70), 2, ORANGE)
box(d, [150, H-46-2, 262, H-46+34], GREEN); marker(d, (300, H-100), 3, GREEN)
box(d, [412, H-46-2, 530, H-46+34], BLUE); marker(d, (570, H-100), 4, BLUE)
box(d, [268, H-46-2, 404, H-46+34], (160,80,255)); marker(d, (330, H-140), 5, (160,80,255))
box(d, [548,4,644,42], ORANGE); marker(d, (690,70), 6, ORANGE)
d.rectangle([60, 110, 760, 300], fill=(30,34,45), outline=BORDER)
d.text((76,120), "Figure 1 — Chart screen (tradingview.com/chart)", fill=TXT, font=F18B)
for i,(n,c,t) in enumerate([
    (1,RED,"Timeframe button: must read  1D . Click it and choose 1 day if it does not."),
    (2,ORANGE,"Symbol box: type RELIANCE and pick the NSE listing, or any NSE stock."),
    (3,GREEN,"Pine Editor tab (bottom bar): opens the code panel. Figure 2."),
    (4,BLUE,"Trading Panel tab (bottom bar): where Paper Trading is switched on. Figure 3."),
    (5,(160,80,255),"Strategy Tester tab: results appear here after you add nss_strategy.pine."),
    (6,ORANGE,"Alert (clock icon): create alerts after the indicator is on the chart. Figure 4."),
]):
    marker(d, (92, 160+i*22), n, c); d.text((118, 152+i*22), t, fill=TXT, font=F14)
im.save("fig1_chart_layout.png")

# ---------- Figure 2: Pine Editor open
im = Image.new("RGB", (W,H)); d = ImageDraw.Draw(im)
chart_frame(d, "schematic")
ph = 360
y = footer(d, active="Pine Editor", open_panel_h=ph)
# editor panel
d.rectangle([52, y+34, W-300, H-46], fill=(24,27,38), outline=BORDER)
ty = y+40
d.rectangle([64, ty, 150, ty+28], fill=(44,48,62), outline=BORDER); d.text((76, ty+6), "Open ▾", fill=TXT, font=F14)
d.text((170, ty+6), "Untitled script", fill=DIM, font=F14)
d.rectangle([W-300-330, ty, W-300-250, ty+28], fill=(44,48,62), outline=BORDER); d.text((W-300-318, ty+6), "Save", fill=TXT, font=F14)
d.rectangle([W-300-240, ty, W-300-110, ty+28], fill=BLUE, outline=BORDER); d.text((W-300-228, ty+6), "Add to chart", fill=(255,255,255), font=F14)
d.rectangle([W-300-100, ty, W-300-20, ty+28], fill=(44,48,62), outline=BORDER); d.text((W-300-90, ty+6), "Publish", fill=DIM, font=F14)
# dropdown
d.rectangle([64, ty+30, 300, ty+150], fill=(44,48,62), outline=BORDER)
for i,t in enumerate(["New indicator", "New strategy", "New library", "Open script..."]):
    d.text((80, ty+40+i*28), t, fill=TXT if i<2 else DIM, font=F14)
# code area
cy = ty+160
code = ["//@version=5", "// NSS - Nifty Swing Signals: INDICATOR ...", "indicator(\"NSS Nifty Swing Signals\", shorttitle=\"NSS\", overlay=true, ...)", "grpG = \"General\"", "capital    = input.float(50000, \"Paper capital (INR)\", ...)", "..."]
for i,l in enumerate(code):
    d.text((80, cy+i*18), f"{i+1:>2}  {l}", fill=(170,200,230) if i else (120,200,120), font=F14)
d.rectangle([64, H-46-40, W-300-20, H-46-10], fill=(40,20,24), outline=RED)
d.text((76, H-46-33), "Console: a RED line like  'line 57: Could not find function ...'  means a compile error. Copy that text to me.", fill=(255,180,180), font=F12)
box(d, [60, ty-4, 154, ty+32]); marker(d, (64+120, ty-30), 1)
box(d, [60, ty+30, 304, ty+92], ORANGE); marker(d, (330, ty+60), 2, ORANGE)
box(d, [70, cy-8, 760, cy+118], GREEN); marker(d, (800, cy+55), 3, GREEN)
box(d, [W-300-334, ty-4, W-300-246, ty+32], BLUE); marker(d, (W-300-290, ty-30), 4, BLUE)
box(d, [W-300-244, ty-4, W-300-106, ty+32], (160,80,255)); marker(d, (W-300-175, ty-30), 5, (160,80,255))
box(d, [60, H-46-44, W-300-16, H-46-6]); marker(d, (W-300-40, H-46-25), 6)
d.rectangle([60, 60, 820, 250], fill=(30,34,45), outline=BORDER)
d.text((76,70), "Figure 2 — Pine Editor panel (after clicking the tab in Figure 1, item 3)", fill=TXT, font=F18B)
for i,(n,c,t) in enumerate([
    (1,RED,"Open ▾ dropdown."),
    (2,ORANGE,"Choose  New indicator  for nss_indicator.pine, or  New strategy  for nss_strategy.pine."),
    (3,GREEN,"Code area: select all (Ctrl+A), delete, paste the whole file."),
    (4,BLUE,"Save: name it NSS (indicator) or NSS-ST (strategy)."),
    (5,(160,80,255),"Add to chart: draws it on the chart. The table appears top-right of the chart."),
    (6,RED,"Console: if a red error appears here, send me the exact text and line number."),
]):
    marker(d, (92, 110+i*22), n, c); d.text((118, 102+i*22), t, fill=TXT, font=F14)
im.save("fig2_pine_editor.png")

# ---------- Figure 3: Trading panel / paper trading
im = Image.new("RGB", (W,H)); d = ImageDraw.Draw(im)
chart_frame(d, "schematic")
ph = 300
y = footer(d, active="Trading Panel", open_panel_h=ph)
d.rectangle([52, y+34, W-300, H-46], fill=(24,27,38), outline=BORDER)
d.text((70, y+46), "Select a broker to start trading", fill=TXT, font=F16)
bx = 70; by = y+80
for i,(name,sub) in enumerate([("Paper Trading","by TradingView · free, no account"),("Zerodha","live, needs account"),("Upstox","live"),("Dhan","live")]):
    d.rectangle([bx, by, bx+260, by+120], fill=(44,48,62) if i==0 else PANEL, outline=GREEN if i==0 else BORDER, width=3 if i==0 else 1)
    d.text((bx+14, by+16), name, fill=TXT, font=F18B); d.text((bx+14, by+50), sub, fill=DIM, font=F12)
    d.rectangle([bx+14, by+80, bx+110, by+106], fill=BLUE if i==0 else (44,48,62), outline=BORDER); d.text((bx+30, by+86), "Connect", fill=(255,255,255) if i==0 else DIM, font=F12)
    bx += 280
marker(d, (70+260+20, by-20), 1)
# after connect: settings
d.rectangle([W-300-520, y+50, W-300-20, H-46-10], fill=PANEL, outline=BORDER)
d.text((W-300-505, y+60), "Paper Trading · Account settings (gear icon)", fill=TXT, font=F14)
d.text((W-300-505, y+95), "Reset Paper Trading account", fill=TXT, font=F14)
d.rectangle([W-300-505, y+120, W-300-300, y+150], fill=(44,48,62), outline=ORANGE, width=3); d.text((W-300-495, y+128), "Balance: 50000", fill=TXT, font=F14)
d.text((W-300-505, y+165), "Currency: INR", fill=DIM, font=F14)
d.rectangle([W-300-505, y+195, W-300-420, y+223], fill=BLUE); d.text((W-300-493, y+201), "Reset", fill=(255,255,255), font=F14)
marker(d, (W-300-280, y+135), 2, ORANGE)
d.rectangle([60, 60, 900, 230], fill=(30,34,45), outline=BORDER)
d.text((76,70), "Figure 3 — Trading Panel → Paper Trading (Figure 1, item 4)", fill=TXT, font=F18B)
for i,(n,c,t) in enumerate([
    (1,RED,"Click  Connect  on the Paper Trading card. No sign-up, no money."),
    (2,ORANGE,"Gear icon → Reset Paper Trading account → set balance to 50000 → Reset."),
    (3,GREEN,"Every paper order you place here is logged; this log is the Phase 4 journal source."),
    (4,BLUE,"Do NOT connect a live broker during the paper phase."),
]):
    marker(d, (92, 110+i*24), n, c); d.text((118, 102+i*24), t, fill=TXT, font=F14)
im.save("fig3_paper_trading.png")

# ---------- Figure 4: alert dialog
im = Image.new("RGB", (W,H)); d = ImageDraw.Draw(im)
chart_frame(d, "schematic")
footer(d)
dx, dy = 520, 160
d.rectangle([dx, dy, dx+560, dy+520], fill=(30,34,45), outline=BORDER, width=2)
d.text((dx+20, dy+16), "Create Alert on RELIANCE", fill=TXT, font=F18B)
d.text((dx+20, dy+60), "Condition", fill=DIM, font=F12)
d.rectangle([dx+20, dy+80, dx+540, dy+112], fill=(44,48,62), outline=RED, width=3); d.text((dx+32, dy+88), "NSS Nifty Swing Signals  ▾", fill=TXT, font=F14)
d.rectangle([dx+20, dy+120, dx+540, dy+152], fill=(44,48,62), outline=ORANGE, width=3); d.text((dx+32, dy+128), "NSS any long setup  ▾", fill=TXT, font=F14)
d.text((dx+20, dy+170), "Trigger", fill=DIM, font=F12)
d.rectangle([dx+20, dy+190, dx+540, dy+222], fill=(44,48,62), outline=GREEN, width=3); d.text((dx+32, dy+198), "Once per bar close  ▾", fill=TXT, font=F14)
d.text((dx+20, dy+240), "Expiration", fill=DIM, font=F12)
d.rectangle([dx+20, dy+260, dx+540, dy+292], fill=(44,48,62), outline=BORDER); d.text((dx+32, dy+268), "Open-ended", fill=TXT, font=F14)
d.text((dx+20, dy+310), "Notifications", fill=DIM, font=F12)
for i,t in enumerate(["☑ Notify in app", "☑ Send email", "☐ Webhook URL (not available via MCP, leave off)"]):
    d.text((dx+32, dy+330+i*24), t, fill=TXT, font=F14)
d.rectangle([dx+400, dy+460, dx+540, dy+496], fill=BLUE); d.text((dx+440, dy+469), "Create", fill=(255,255,255), font=F14)
marker(d, (dx+590, dy+96), 1); marker(d, (dx+590, dy+136), 2, ORANGE); marker(d, (dx+590, dy+206), 3, GREEN); marker(d, (dx+570, dy+478), 4, BLUE)
d.rectangle([60, 60, 500, 330], fill=(30,34,45), outline=BORDER)
d.text((76,70), "Figure 4 — Alert dialog (Figure 1, item 6)", fill=TXT, font=F18B)
for i,(n,c,t) in enumerate([
    (1,RED,"Condition: pick the NSS indicator."),
    (2,ORANGE,"Pick  NSS any long setup . For full text with"),
    (0,ORANGE,"entry/stop/qty choose  Any alert() function call ."),
    (3,GREEN,"Trigger: Once per bar close (3:30 pm IST)."),
    (4,BLUE,"Create. Repeat per stock you watch, or set"),
    (0,BLUE,"the indicator on a watchlist of Nifty 50 names."),
]):
    if n: marker(d, (92, 110+i*26), n, c)
    d.text((118, 102+i*26), t, fill=TXT, font=F14)
im.save("fig4_alerts.png")
print("done")
