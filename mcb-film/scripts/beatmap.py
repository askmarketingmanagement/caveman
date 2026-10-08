#!/usr/bin/env python3
"""Beat-map a music file with librosa. Writes plan/music_map.json and plan/music_map.md.
Usage: python3 scripts/beatmap.py audio/music/<track>.wav [--start-bpm 152]
Reports BPM, beat grid, downbeats (estimated every 4 beats from the strongest onset), RMS energy curve,
the drop (largest 0.5 s RMS jump), and whether the drop falls in the 26-29 s window PROMPT §6 requires."""
import sys, json, argparse, numpy as np, librosa

ap = argparse.ArgumentParser(); ap.add_argument("audio"); ap.add_argument("--start-bpm", type=float, default=152.0)
ap.add_argument("--drop-lo", type=float, default=15.0); ap.add_argument("--drop-hi", type=float, default=40.0)
a = ap.parse_args()
y, sr = librosa.load(a.audio, sr=22050, mono=True)
dur = len(y)/sr
tempo, beats = librosa.beat.beat_track(y=y, sr=sr, units="time", start_bpm=a.start_bpm)
tempo = float(np.atleast_1d(tempo)[0])
onset_env = librosa.onset.onset_strength(y=y, sr=sr)
ot = librosa.frames_to_time(np.arange(len(onset_env)), sr=sr)
# downbeat phase: among the 4 phases, pick the one whose beats carry the most onset energy
def strength_at(t): return float(np.interp(t, ot, onset_env))
phase = max(range(4), key=lambda p: sum(strength_at(b) for b in beats[p::4]))
downbeats = [float(b) for b in beats[phase::4]]
rms = librosa.feature.rms(y=y, frame_length=2048, hop_length=512)[0]
rt = librosa.frames_to_time(np.arange(len(rms)), sr=sr, hop_length=512)
rms_db = 20*np.log10(np.maximum(rms, 1e-6))
win = int(0.5*sr/512)
cands = [(rt[i], rms_db[i+win]-rms_db[i]) for i in range(len(rms)-win) if a.drop_lo < rt[i] < a.drop_hi]
drop_t, drop_jump = max(cands, key=lambda x: x[1]) if cands else (None, None)
drop_t = float(drop_t) if drop_t is not None else None
silence_from = next((float(rt[i]) for i in range(len(rms)-1, 0, -1) if rms_db[i] > -60), None)
out = {"audio": a.audio, "duration_s": round(dur,3), "tempo_bpm": round(tempo,2), "beat_s": round(60/tempo,4),
       "beats": [round(float(b),3) for b in beats], "downbeats": [round(d,3) for d in downbeats],
       "drop_t": round(drop_t,2) if drop_t else None, "drop_jump_db": round(float(drop_jump),1) if drop_jump else None,
       "drop_in_window_26_29": bool(drop_t and 26.0 <= drop_t <= 29.0),
       "silence_from_s": round(silence_from,2) if silence_from else None,
       "rms_db_per_s": [round(float(rms_db[(rt>=s)&(rt<s+1)].mean()),1) for s in range(int(dur))]}
json.dump(out, open("plan/music_map.json","w"), indent=1)
md = [f"# Music map: `{a.audio}`", "", f"- Duration: {dur:.2f} s", f"- Tempo: {tempo:.2f} BPM (beat {60/tempo:.4f} s, half-beat {30/tempo:.4f} s, bar {240/tempo:.3f} s)",
      f"- Beats detected: {len(beats)}; first beat {beats[0]:.3f} s; downbeat phase {phase}",
      f"- Drop (largest 0.5 s RMS jump in {a.drop_lo:.0f}-{a.drop_hi:.0f} s): **{drop_t}** s (+{drop_jump:.1f} dB)" if drop_t else "- Drop: none found",
      f"- Drop inside 26-29 s window: **{'YES' if out['drop_in_window_26_29'] else 'NO -> edit music (PROMPT §6)'}**",
      f"- Silence from: {silence_from} s", "", "## Energy (mean RMS dBFS per second)", "",
      "| s | " + " | ".join(str(s) for s in range(int(dur))) + " |", "|" + "---|"*(int(dur)+1),
      "| dB | " + " | ".join(str(v) for v in out["rms_db_per_s"]) + " |", "",
      "## Downbeats (s)", "", ", ".join(f"{d:.2f}" for d in downbeats), "",
      "Re-run `scripts/build_shot_list.py` after this to re-snap the cut list to this grid."]
open("plan/music_map.md","w").write("\n".join(md)+"\n")
print(json.dumps({k:v for k,v in out.items() if k not in ("beats","rms_db_per_s","downbeats")}, indent=1))
