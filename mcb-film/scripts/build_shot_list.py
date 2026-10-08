#!/usr/bin/env python3
"""Build plan/shot_list.csv from the PROMPT §4 target timings, snapped to a beat grid.

Until the real music arrives the grid is the 152 BPM click (beat 0.3947 s, half-beat 0.1974 s,
"bar" = 4 beats = 1.579 s). When plan/music_map.json exists (written by scripts/beatmap.py)
the grid comes from there instead. Re-run after beatmap.py and the CSV re-snaps.
"""
import csv, json, os, sys

BPM = 152.0
grid_src = "click 152 BPM"
if os.path.exists("plan/music_map.json"):
    mm = json.load(open("plan/music_map.json"))
    BPM = mm["tempo_bpm"]; grid_src = "plan/music_map.json"
BEAT = 60.0 / BPM; HALF = BEAT / 2; BAR = BEAT * 4
FPS = 24

def snap(t, unit):
    return round(round(t / unit) * unit, 3)

# id, act, target_in, snap_unit, picture, method, source_stills, camera_move, lighting, callout_ui, sfx, notes
S = [
 (1, 1, 0.0,  BAR, "Fade from black (0.3 s) into macro of a silver contact tip turning slowly; specular highlight glides across it", "blender|i2v", "stills/act1/01_contact_tip.png", "slow push + ~10 deg rotation; drift <=10 px/s median (ref shot 1: 3.9 px/s median, 106 px/s p90 specular glide)", "black void, cold white rim light, extreme macro, shallow DOF", "", "sub impact @0.0; glass shimmer on specular", ""),
 (2, 1, 3.0,  BAR, "Arc-chute splitter plates floating in a fanned stack, steel edges catching light", "blender|i2v", "stills/act1/02_arc_plates.png", "slow drift + tumble; ~60 px/s median (ref shot 2)", "black -> faint navy, icy blue-white edges", "", "tonal ting on edge highlights", ""),
 (3, 1, 5.0,  BAR, "Bimetal strip + trip coil and a latch spring tumbling slowly; blue gradient blooms in from screen-right", "blender|i2v", "stills/act1/03_bimetal_spring.png", "slow orbit; <=5 px/s median (ref shot 3: 1.5 px/s)", "black; first blue bloom at right motivates Act 2 colour", "", "ting; low pad swell", ""),
 (4, 1, 7.5,  BAR, "Transition: pane of optical glass (the headset display glass) drifts through frame and catches the light", "blender|i2v", "stills/act1/04_glass_pane.png", "lateral drift ~10 px/s (ref shot 4: 10 px/s)", "navy gradient begins, soft particles", "", "airy glass shimmer", "bridge MCB parts -> wearable parts"),
 (5, 2, 10.0, HALF, "See-through glass slides into its frame in front of where the eye will be", "i2v start+end|2.5D", "stills/act2/05_glass_start.png;stills/act2/05_glass_end.png", "slow slide along the part ~18 px/s (ref shot 5)", "navy gradient, teal glow top-right, gunmetal product", "display", "mechanical seat click; UI draw tick", "callout at seat moment"),
 (6, 2, 12.3, HALF, "PCB macro; AI chip die glints; traces light up in sequence", "i2v|2.5D", "stills/act2/06_pcb.png", "slow push; near-static", "navy, hard speculars on solder", "ai", "soft electronic tick sequence; UI draw tick", "sub2 'MPU + MCU' shown"),
 (7, 2, 14.6, HALF, "Camera module seats into the front; lens iris catches light", "i2v start+end|2.5D", "stills/act2/07_camera_start.png;stills/act2/07_camera_end.png", "slow push (ref shot 6)", "steel grey + navy, hard speculars", "camera", "precise seat click; UI draw tick", ""),
 (8, 2, 16.6, HALF, "Temple-side bone-conduction transducer clicks into the band", "i2v start+end|2.5D", "stills/act2/08_transducer_start.png;stills/act2/08_transducer_end.png", "slow tilt", "blue light sweep across metal (ref shot 7)", "voice", "click; UI draw tick", ""),
 (9, 2, 18.8, HALF, "Speaker grille macro; subtle pressure ripple on the air", "i2v", "stills/act2/09_speaker.png", "near-static, slight push", "navy, teal rim", "speaker", "soft low pulse; UI draw tick", ""),
 (10, 2, 20.6, HALF, "Board edge: ESP Wi-Fi module and memory chip seat", "i2v start+end|2.5D", "stills/act2/10_board_edge_start.png;stills/act2/10_board_edge_end.png", "slow slide", "navy, speculars", "connect", "two seat clicks; UI draw tick", ""),
 (11, 2, 22.6, HALF, "Status LED powers on (power-on beat). No callout", "i2v", "stills/act2/11_led.png", "static", "blue sweep then LED glow", "", "LED power-on tone", ""),
 (12, 3, 24.0, HALF, "Ghosted, double-exposed profile of the worker (teal); transition beat", "i2v|comp", "stills/act3/12_ghost_profile.png", "dissolve/ghost", "teal key, near-black", "", "riser peak", "mirrors ref shot 8"),
 (13, 3, 24.6, HALF, "HERO REVEAL: complete headset floating, slow 3/4 rotation, top rim light, dark studio", "i2v (product bible hero)", "stills/bible/hero_34.png;stills/bible/front.png", "locked-off camera, product rotates ~15 deg", "dark studio, top rim light", "", "pre-drop dip in music", ""),
 (14, 3, 27.0, HALF, "DROP on first frame. Worker's hands lift the headset and put it on; blue backdrop, close, handheld feel", "i2v", "stills/act3/14_hands_on.png", "handheld, close; fast hand motion", "saturated blue backdrop", "", "DROP; cloth/handling foley", "hands never tap the device"),
 (15, 3, 28.5, HALF, "3/4 close-up of worker wearing it, focused; slow push. Then macro of the camera window on the device", "i2v x2 (split at ~29.6)", "stills/act3/15a_worn_34.png;stills/act3/15b_camera_window.png", "slow push (~60 px/s p90 ref shot 12)", "blue bg, warm skin", "", "", ""),
 (16, 3, 30.5, HALF, "Dip to dark blue, then extreme eye macro; display glass as soft reflection in the iris", "i2v|comp", "stills/act3/16_eye_macro.png", "static", "cool key, bright catchlight", "", "dip whoosh", "mirrors ref shot 14"),
 (17, 4, 31.5, HALF, "Wide: assembly line, rows of stations, the worker at her bench wearing the device", "i2v", "stills/act4/17_line_wide.png", "static medium-wide (ref shot 15)", "practical cyan/white, ESD benches", "", "factory ambience in (under music)", "no readable text in plate"),
 (18, 4, 32.5, HALF, "POV through the glass, hero UI 1: hands hold moving-contact assembly steady; amber outline on tip, label 'Contact tip oxidised', verdict REJECT; worker says 'Reject.'; shutter tick + toast", "i2v (steady hands) + Remotion OnGlassUI tracked", "stills/act4/18_pov_contact.png", "POV, hands steady; minimal drift so tracking holds", "natural bench light, cool", "ui.defect_1;ui.verdict_reject;ui.toast_photo;voice.worker_1", "outline tick; REJECT low note; shutter; voice 'Reject.'", "track -> gfx/tracks/18.json"),
 (19, 4, 36.5, HALF, "Close-up of her eye/face with the glass lit; teal/orange split", "i2v", "stills/act4/19_face_split.png", "static, slight whip in", "teal/orange split", "", "", "mirrors ref shot 17"),
 (20, 4, 37.3, HALF, "POV hero UI 2: finished MCB in hands; thin sweep scans it; PASS in green; she says 'Next.'; MCB slides to conveyor toward composited sign 'Electrical testing'", "i2v + Remotion OnGlassUI tracked + sign comp", "stills/act4/20_pov_mcb.png", "POV; hands steady then slide right", "natural bench light", "ui.verdict_pass;ui.station_sign;voice.worker_2", "sweep tone; PASS two-note; voice 'Next.'", "track -> gfx/tracks/20.json"),
 (21, 4, 40.0, HALF, "Flash burst: 3-5 micro-cuts of 2-3 frames with whip blur", "edit (frames from 17-25 + whip blur)", "", "whips", "mixed", "", "hits", "mirrors ref 30.4-30.8; lands on hits"),
 (22, 4, 40.4, HALF, "POV critical: MCB with arc chute missing a plate; red outline on chute, 'Arc plate missing', REJECT; device voice: 'Critical. Arc plate missing.'", "i2v + Remotion OnGlassUI tracked", "stills/act4/22_pov_arc_chute.png", "POV, steady", "natural, slightly colder", "ui.defect_2;ui.verdict_reject;voice.device_1", "REJECT low note; device voice band-limited", "track -> gfx/tracks/22.json"),
 (23, 4, 43.0, HALF, "Supervisor at line-end with tablet: shift report bars + trend alert card; rack focus tablet -> line", "i2v + Remotion Tablet comp (screen replace)", "stills/act4/23_supervisor_tablet.png", "rack focus", "cool practicals, one warm accent", "ui.tablet_title;ui.tablet_bars;ui.trend_alert", "soft UI tick", "tablet screen tracked -> gfx/tracks/23.json"),
 (24, 4, 45.5, HALF, "Medium: QC inspector reviewing a rejected-part photo (with batch code) on a monitor; traceability beat", "i2v + Remotion MonitorPhoto comp", "stills/act4/24_qc_monitor.png", "static", "monitor glow, cool", "ui.toast_photo (batch code reuse)", "", "monitor tracked -> gfx/tracks/24.json"),
 (25, 4, 46.5, HALF, "Fast montage, 3 shots on the beat: hands assembling, toggle flicked, tray of passed MCBs", "i2v x3", "stills/act4/25a_hands.png;stills/act4/25b_toggle.png;stills/act4/25c_tray.png", "static/close", "one magenta/amber accent shot here", "", "3 hits", "cuts at +0.0 / +0.66 / +1.33 approx, snapped to beats"),
 (26, 4, 48.5, HALF, "Macro: fingers adjust the device's glass position; then the eye seen through the glass", "i2v x2", "stills/act4/26a_adjust.png;stills/act4/26b_eye_through_glass.png", "close; static", "blue rim; skin with blue edge", "", "", "mirrors ref 23-24; adjusting glass != tapping a control"),
 (27, 5, 50.0, HALF, "ONLY high-key shot: bright seamless pale-lavender/white set; headset set down beside tray of passed MCBs; hand leaves; it rests", "i2v start+end", "stills/act5/27_rest_start.png;stills/act5/27_rest_end.png", "locked-off", "high-key, luma ~182/255, sat ~30 (ref dock shot)", "", "music decays", "no dock: brief has none"),
 (28, 5, 53.0, HALF, "Hard cut to black", "remotion", "", "", "black", "", "", ""),
 (29, 5, 53.5, HALF, "Product name card: white on black, fade in 0.5 s, hold 0.8 s, fade out 0.8 s", "remotion EndCards", "", "static", "white on #000", "end.name;end.descriptor", "soft swell", ""),
 (30, 5, 55.8, HALF, "Black", "remotion", "", "", "black", "", "", ""),
 (31, 5, 56.2, HALF, "Logo card: fade in 0.25 s, hold ~3 s, fade out 0.5 s; audio silent from ~58.0", "remotion EndCards", "", "static", "white on #000", "end.logo", "soft swell then silence", "logo missing in brand/ -> wordmark or skip (PROMPT §10)"),
 (32, 5, 59.6, HALF, "Black tail", "remotion", "", "", "black", "", "", ""),
]
END_TARGET = 60.3
rows = []
ins = [snap(s[2], s[3]) for s in S] + [snap(END_TARGET, HALF)]
for i, s in enumerate(S):
    a, b = ins[i], ins[i+1]
    rows.append({
        "id": s[0], "act": s[1], "in_s": f"{a:.3f}", "out_s": f"{b:.3f}", "dur_s": f"{b-a:.3f}",
        "in_frame": round(a*FPS), "out_frame": round(b*FPS), "target_in_s": s[2],
        "snap_unit": "bar" if s[3]==BAR else "half-beat",
        "picture": s[4], "method": s[5], "source_stills": s[6], "camera_move": s[7], "lighting": s[8],
        "callout_ui_id": s[9], "sfx_cues": s[10], "neg_space_box": "TBD-P2 (measure on key still)", "notes": s[11],
    })
with open("plan/shot_list.csv", "w", newline="") as f:
    w = csv.DictWriter(f, fieldnames=list(rows[0].keys())); w.writeheader(); w.writerows(rows)
tot = ins[-1]
print(f"grid: {grid_src}  beat={BEAT:.4f}s  half={HALF:.4f}s  bar={BAR:.3f}s")
print(f"{len(rows)} shots, runtime {tot:.3f}s ({round(tot*FPS)} frames)")
for r in rows:
    d = float(r['in_s']) - r['target_in_s']
    flag = "  <-- >0.5s off target" if abs(d) > 0.5 else ""
    print(f"  {r['id']:>2} act{r['act']} {r['in_s']:>7} -> {r['out_s']:>7}  dur {r['dur_s']:>6}  (target {r['target_in_s']:>5}, Δ{d:+.2f}){flag}")
