#!/usr/bin/env python3
"""Measure grade targets, drift speeds and beat grid of ref/reference.mp4.
Writes JSON to ref/reference_measurements.json. Read-only on the source."""
import json, sys, subprocess, cv2, numpy as np
import librosa

SRC = "ref/reference.mp4"
AUDIO = "ref/reference_audio.wav"
# Shot windows from REFERENCE_ANALYSIS.md §3 (in, out, label)
SHOTS = [(0.0,3.66,"1 lens rim"),(3.66,5.24,"2 prism"),(5.24,7.78,"3 rings"),(7.78,10.08,"4 exploded"),
 (10.08,13.14,"5 chassis screws"),(13.14,16.18,"6 camera+glass"),(16.18,18.46,"7 hinge LED"),(18.46,19.06,"8 ghost"),
 (19.06,20.74,"9 hero"),(20.74,21.58,"10 rack focus"),(21.58,23.74,"11 hands"),(23.74,25.64,"12 worn"),
 (25.64,26.78,"13 window macro"),(26.78,27.44,"14 eye"),(27.44,28.24,"15 lab wide"),(28.24,29.32,"16 POV UI"),
 (29.32,29.76,"17 face split"),(29.76,30.40,"18 magenta"),(30.82,31.70,"19 profile"),(31.70,32.62,"20 cell wide"),
 (32.62,33.42,"21 face down"),(33.62,34.62,"22 robot medium"),(34.62,35.16,"23 adjust"),(35.16,36.08,"24 eye optic"),
 (36.08,38.86,"25 dock high-key"),(39.30,41.40,"26 title"),(41.85,45.80,"27 logo")]

cap = cv2.VideoCapture(SRC)
fps = cap.get(cv2.CAP_PROP_FPS); n = int(cap.get(cv2.CAP_PROP_FRAME_COUNT))
W = int(cap.get(cv2.CAP_PROP_FRAME_WIDTH)); H = int(cap.get(cv2.CAP_PROP_FRAME_HEIGHT))
frames = {}
idx = 0
per_frame = []  # (t, mean_luma, mean_sat, black_pct)
prev_gray = None; flow_mag = []
ok, f = cap.read()
while ok:
    t = idx / fps
    small = cv2.resize(f, (480, 270), interpolation=cv2.INTER_AREA)
    hsv = cv2.cvtColor(small, cv2.COLOR_BGR2HSV)
    gray = cv2.cvtColor(small, cv2.COLOR_BGR2GRAY)
    per_frame.append((t, float(gray.mean()), float(hsv[...,1].mean()), float((gray < 16).mean()*100), float(np.percentile(gray, 99.5))))
    if prev_gray is not None and idx % 2 == 0:
        flow = cv2.calcOpticalFlowFarneback(prev_gray, gray, None, 0.5, 3, 15, 3, 5, 1.2, 0)
        mag = np.linalg.norm(flow, axis=2)
        # median magnitude of moving pixels (ignore static black) in small-frame px per frame
        moving = mag[gray > 24]
        flow_mag.append((t, float(np.median(moving)) if moving.size else 0.0, float(np.percentile(moving,90)) if moving.size else 0.0))
    prev_gray = gray
    idx += 1
    ok, f = cap.read()
cap.release()
pf = np.array(per_frame); fm = np.array(flow_mag)
scale = W/480.0
out = {"src": SRC, "fps": fps, "frames": n, "size": [W,H], "shots": []}
for a,b,label in SHOTS:
    m = (pf[:,0]>=a)&(pf[:,0]<b)
    mf = (fm[:,0]>=a)&(fm[:,0]<b)
    seg = pf[m]
    drift = fm[mf]
    out["shots"].append({
        "label": label, "in": a, "out": b, "dur": round(b-a,2),
        "mean_luma_0_255": round(float(seg[:,1].mean()),1),
        "mean_sat_0_255": round(float(seg[:,2].mean()),1),
        "black_pct_lt16": round(float(seg[:,3].mean()),1),
        "highlight_p99_5": round(float(seg[:,4].mean()),1),
        # median flow of moving pixels, converted to 1080p px/s (flow measured over 1 frame at 50fps)
        "drift_px_per_s_median": round(float(np.median(drift[:,1]))*scale*fps,1) if drift.size else None,
        "drift_px_per_s_p90": round(float(np.median(drift[:,2]))*scale*fps,1) if drift.size else None,
    })
# whole-film grade targets by act
acts = {"act1":(0,7.78),"act2":(7.78,18.46),"act3":(18.46,27.44),"act4":(27.44,36.08),"act5_dock":(36.08,38.86)}
out["acts"] = {}
for k,(a,b) in acts.items():
    m = (pf[:,0]>=a)&(pf[:,0]<b); seg = pf[m]
    out["acts"][k] = {"mean_luma": round(float(seg[:,1].mean()),1), "mean_sat": round(float(seg[:,2].mean()),1),
                      "black_pct": round(float(seg[:,3].mean()),1), "highlight_p99_5": round(float(seg[:,4].mean()),1)}
# audio: tempo, beats, onsets, RMS, drop
y, sr = librosa.load(AUDIO, sr=22050, mono=True)
tempo, beats = librosa.beat.beat_track(y=y, sr=sr, units="time", start_bpm=152)
tempo = float(np.atleast_1d(tempo)[0])
rms = librosa.feature.rms(y=y, frame_length=2048, hop_length=512)[0]
rt = librosa.frames_to_time(np.arange(len(rms)), sr=sr, hop_length=512)
rms_db = 20*np.log10(np.maximum(rms,1e-6))
# drop = largest positive RMS jump over 0.5 s between 15 and 30 s
win = int(0.5*sr/512)
jumps = [(rt[i], rms_db[i+win]-rms_db[i]) for i in range(len(rms)-win) if 15<rt[i]<30]
drop_t = max(jumps, key=lambda x:x[1])
silence_from = None
for i in range(len(rms)-1, 0, -1):
    if rms_db[i] > -60: silence_from = rt[i]; break
out["audio"] = {"tempo_bpm": round(tempo,1), "beat_interval_s": round(60/tempo,3), "n_beats": len(beats),
                "first_beats": [round(float(b),2) for b in beats[:12]],
                "drop_t": round(float(drop_t[0]),2), "drop_jump_db": round(float(drop_t[1]),1),
                "silence_from_s": round(float(silence_from),2) if silence_from else None,
                "rms_db_curve_1s": [round(float(rms_db[(rt>=s)&(rt<s+1)].mean()),1) for s in range(0,46)]}
json.dump(out, open("ref/reference_measurements.json","w"), indent=1)
print(json.dumps(out["acts"], indent=1))
print(json.dumps(out["audio"], indent=1)[:900])
for s in out["shots"]: print(f'{s["label"]:18s} luma {s["mean_luma_0_255"]:5.1f} sat {s["mean_sat_0_255"]:5.1f} blk% {s["black_pct_lt16"]:5.1f} hi {s["highlight_p99_5"]:5.1f} drift {s["drift_px_per_s_median"]} / p90 {s["drift_px_per_s_p90"]}')
