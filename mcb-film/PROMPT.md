# Build prompt: product film for the MCB inspection wearable

Paste everything below the line into Claude Code, opened in the project folder described in §2.

---

## 0. Your role and how to work

You are the single owner of this video, from pre-production to the final MP4. Work lean:

- **One owner, no crew.** Do not invoke the `cinema-crew` skills (director / editor / producer / vfx-supervisor etc.) or spawn role-play sub-agents. A previous long edit run that way was slow and wasteful. You may use a sub-agent only for one isolated, mechanical job (for example "generate these 6 stills in parallel"), with a defined output.
- **Analysis before building.** `ref/REFERENCE_ANALYSIS.md` is already written. Read it fully, then watch the reference yourself (step P0.3) and add anything it missed *before* writing any build code.
- **Write the plan to files, then build from the files.** Every decision lives in `plan/` (shot list, copy deck, design bible, music map). Nothing important lives only in chat.
- **Keep a handoff file.** Keep `HANDOFF.md` at the project root and update it at the end of every phase and before any long-running step: current phase, what's done, what's approved by Paras, what's pending, open questions, file locations, and the **non-negotiables in §1 copied verbatim**. If your context is compacted, re-read `HANDOFF.md`, `plan/`, and this prompt before doing anything else.
- **Verify with scripts.** Every check in §9 is a script in `scripts/verify_*.py` that prints PASS/FAIL. Don't say something works without running its check. Also look at the contact sheets yourself; scripts can't judge taste.
- **Bounded revision loops.** Max **2 regeneration attempts per shot**. If a shot still fails, stop retrying, write a diagnosis in `plan/issues.md` (what's wrong, why the model keeps doing it, 2 alternative fixes: re-frame, different method, cut the shot) and move on. Never burn credits retrying the same prompt.
- **Stop at the gates.** There are 4 approval gates (§8). At each one, deliver what's listed, ask Paras, and wait. Do not start the next phase's paid generation without approval.

## 1. Non-negotiables (copy into HANDOFF.md)

1. **The film is like the RealWear "This is Arc 3" film in craft, not in content.** Copy its structure, pacing, lighting language, and restraint. **Do not** copy RealWear's industrial design (curved band with drop-down boom pod), its dock shape, or its names ("RealWear", "Arc", "Ari OS"). Our headset must be recognisably *different*.
2. **No invented numbers.** The brief says resolution, megapixels, memory, battery life, and weight are not finalised, and detection accuracy is an open point. Put **no figures, percentages, accuracy claims, certifications (IP/ATEX/MIL), or battery claims** on screen. Specs are named qualitatively, in the brief's own words.
3. **Every on-screen word comes from `plan/copy.json`**, which Paras approves at Gate 1. The renderer reads text only from that file. AI image and video models must **never** render text, UI, or logos; all text and UI is composited afterwards.
4. **All detection shown is visual.** Never show the wearable doing electrical tests (trip-time, dielectric). The finished MCB passes the visual check and then goes *to* the electrical test station.
5. **The product is a concept.** Nothing in the film claims a real customer, a real deployment, or real factory data. UI data (batch codes, station numbers, times) is illustrative and consistent across shots.
6. **Hands stay on the job.** Every worker interaction with the device is by voice or glance, never by tapping the device. That's the product's core promise.
7. **Respect the budget.** Before every batch of paid generation, write the estimated credits/cost to `plan/budget.md` and stay under Paras's cap (§2, `INPUTS.md`).

## 2. Project folder (Paras sets this up; you verify it in P0)

```
project/
├── PROMPT.md                  ← this file
├── INPUTS.md                  ← Paras's answers (name, logo, colours, budget, music choice…)
├── ref/
│   ├── reference.mp4          ← "This is Arc 3" RealWear film, 1920×1080 50fps, 46.5 s
│   └── REFERENCE_ANALYSIS.md  ← frame-by-frame breakdown (already done)
├── brief/
│   ├── BRIEF.md               ← text transcription of the client brief
│   └── *.png                  ← original brief screenshots (source of truth)
├── brand/                     ← logo (SVG/PNG with alpha), fonts, colours: may be empty
├── audio/
│   ├── music/                 ← Envato track Paras downloads (WAV preferred)
│   └── sfx/                   ← Envato SFX Paras downloads (optional)
├── plan/  stills/  shots/  gfx/  audio_work/  edit/  out/  scripts/   ← you create these
└── HANDOFF.md                 ← you create and maintain this
```

If `INPUTS.md` is missing an answer, use the default in §10 and log it in `HANDOFF.md` as an assumption. Don't block on it unless it's marked **[BLOCKING]**.

## 3. What we're making (deliverable spec)

| Item | Spec |
|---|---|
| Master | 16:9, 1920×1080, **24 fps** (matches AI-video native rate; no frame-rate conversion), H.264 High, ~20 Mbps, `out/<name>_master_16x9.mp4` |
| Length | **58–62 s** (reference is 46.5 s; we add about 14 s because we must show specs and the use case) |
| Audio | Music + sound design + a few diegetic voice lines (§6). No narrator VO. **−14 LUFS integrated, ≤ −1.0 dBTP**, stereo 48 kHz |
| Finishing handoff | `edit/<name>.xml` (FCP7 XML that Premiere Pro imports) referencing the shot files in `shots/final/`, the graphics renders in `gfx/` as ProRes 4444 with alpha, and the mixed audio plus stems (music / sfx / voice) in `audio_work/stems/`. Paras finishes in Premiere |
| Optional | 9:16 1080×1920 cut-down, 25–30 s, only if `INPUTS.md` asks for it, built after the master is approved |
| Review files | `out/contact_sheet.jpg` (1 frame/s, timestamped), `out/shot_list_final.csv` |

## 4. The story: map the reference to our product

The reference goes **parts → product → person → work → rest → name**. We keep that spine, but our "parts" are **the MCB parts the device inspects**, and our "work" is **an MCB assembly line**. That gives the film a reason to exist: the opening elements are what the wearable protects.

Target timing is for 60 s. The final cut points snap to the music's beat grid (§6), so treat these as ±0.5 s.

### Act 1: Elements (0–10 s, ~17%) · "what we protect"
Black void, cold white rim light, extreme macro, shallow depth of field, slow drifting rotation (mirrors reference shots 1–3).
1. **0.0–3.0** Fade from black (0.3 s) into a macro of a **silver contact tip** turning slowly; specular highlight glides across it. *Sub impact on frame 1.*
2. **3.0–5.0** **Arc-chute splitter plates** floating in a fanned stack, steel edges catching light.
3. **5.0–7.5** **Bimetal strip + trip coil** and a **latch spring**, tumbling slowly; a blue gradient starts to bloom in from screen-right (it motivates Act 2's colour).
4. **7.5–10.0** Transition element: a pane of **optical glass** (the headset's display glass) drifts through frame and catches the light. This bridges MCB parts to wearable parts.

### Act 2: Assembly + specs (10–24 s, ~23%) · "how it's built"
Navy gradient, teal glow, gunmetal and graphite product, macro detail with parts **assembling** (sliding and seating, never exploding outward). **One spec per shot**, revealed as a thin-line callout (see §5) timed to the moment the proving part seats:

| # | Time | Picture | Callout (from copy.json) |
|---|---|---|---|
| 5 | 10.0–12.3 | See-through glass slides into its frame in front of where the eye will be | **See-through display** · defects outlined over the real part |
| 6 | 12.3–14.6 | PCB macro; the AI chip's die glints; traces light up in sequence | **On-device AI** · real-time inspection, no internet needed |
| 7 | 14.6–16.6 | Camera module seats into the front; lens iris catches light | **Inspection camera** · every part captured as evidence |
| 8 | 16.6–18.8 | Temple-side bone-conduction transducer clicks into the band | **Voice control** · bone-conduction mic, noise cancelling |
| 9 | 18.8–20.6 | Speaker grille macro; a subtle pressure ripple on the air | **Spoken alerts** · built-in speakers |
| 10 | 20.6–22.6 | Board edge: ESP Wi-Fi module and memory chip seat | **Wi-Fi · On-board memory · GPS tagging** · works offline, syncs to the cloud |
| 11 | 22.6–24.0 | Status LED powers on (the reference's "power on" beat). No callout | — |

The MPU + MCU spec appears as the small secondary line on shot 6 if copy.json includes it (the default does).

### Act 3: Reveal + human (24–31.5 s, ~13%) · "meet it". The drop at 27 s sits at 45% of runtime, the same as the reference
12. **24.0–24.6** Ghosted, double-exposed profile of a worker (teal); a transition beat (mirrors reference shot 8).
13. **24.6–27.0** **Hero reveal**: complete headset floating, slow ¾ rotation, top rim light, dark studio. *Pre-drop dip in the music.*
14. **27.0–28.5** **DROP on the first frame.** Worker's hands lift the headset and put it on (blue backdrop, close, handheld feel).
15. **28.5–30.5** ¾ close-up of the worker wearing it, focused; slow push. Then a macro of the camera window on the device.
16. **30.5–31.5** Dip to dark blue, then an **extreme eye macro**; the display glass is a soft reflection in the iris (mirrors reference shot 14).

### Act 4: On the line (31.5–50 s, ~31%) · "proof": the longest act and the reason the film exists
Real-feeling Indian MCB factory: ESD-safe workbenches, blue/grey anti-static coats, conveyors, trays of MCBs, practical cyan/white light; one magenta/amber accent shot for rhythm like the reference montage. Workers stay focused and mid-task; nobody smiles at camera.

17. **31.5–32.5** Wide: assembly line, rows of stations, the worker at her bench wearing the device.
18. **32.5–36.5** **POV through the glass, hero UI moment 1.** Hands hold a moving-contact assembly steady. The on-glass UI draws an **amber outline** around the tip, then the label `Contact tip oxidised` and the verdict `REJECT`. The worker says **"Reject."** A shutter tick and a small toast: `Photo saved · Station 04 · Batch B-2611 · 14:32`.
19. **36.5–37.3** Close-up of her eye/face with the glass lit; teal/orange split.
20. **37.3–40.0** **POV, hero UI moment 2.** The finished MCB in her hands; the UI scans it (thin sweep line) and shows `PASS` in green. She says **"Next."** The MCB slides onto the conveyor toward a sign/station that reads (composited) `Electrical testing`.
21. **40.0–40.4** Flash burst: 3–5 micro-cuts of 2–3 frames with whip blur (mirrors reference 30.4–30.8).
22. **40.4–43.0** **POV, critical moment.** An MCB with an arc chute where a plate is missing: a **red outline** on the chute, then `Arc plate missing` and `REJECT`, and the **device voice speaks**: "Critical. Arc plate missing." (bone-conduction feel: close, dry, slightly band-limited).
23. **43.0–45.5** Supervisor at the line-end with a tablet: **shift report** bars (defect counts by type / part / station) and a **trend alert** card: `Discolouration rising · Station 04`. Rack focus from tablet to the line.
24. **45.5–46.5** Medium shot: QC inspector reviewing a rejected-part photo (with batch code) on a monitor; traceability beat.
25. **46.5–48.5** Fast montage, 3 shots on the beat: hands assembling, a toggle flicked, a tray of passed MCBs.
26. **48.5–50.0** Macro: fingers adjust the device's glass position; then the eye seen through the glass (mirrors reference shots 23–24).

### Act 5: Rest + sign-off (50–60 s, ~17%)
27. **50.0–53.0** **The only high-key shot**: bright seamless pale-lavender/white set. The headset is set down beside a neat tray of passed MCBs; the hand leaves; it rests. Music decays. (This replaces the reference's dock shot: the brief has no dock, so don't invent one.)
28. **53.0–53.5** Hard cut to black.
29. **53.5–55.8** Product name card: white on black, fade in 0.5 s, hold 0.8 s, fade out 0.8 s (exact reference timing).
30. **55.8–56.2** Black.
31. **56.2–59.6** Logo card (Paras's company/client logo): fade in 0.25 s, hold ~3 s, fade out 0.5 s. Audio is already silent from ~58.0.
32. **59.6–60.3** Black tail.

## 5. Visual system (write to `plan/design_bible.md` first)

**Palette.** Near-black `#050608` void · gunmetal/graphite product · **one** accent: electric blue → teal (default `#1E6BFF` → `#18C3B3`), unless `INPUTS.md` gives brand colours. UI semantic colours: pass `#2BD67B`, check `#FFB020`, reject `#FF3B3B`, all at 85% opacity with a soft glow, so they read as projected light. Warm tones only on skin, brass/silver MCB contacts, and one accent montage shot.

**The product (industrial design).** None exists, so you design it in P1. Constraints from the brief: head-mounted; a **see-through glass in front of one eye**; a **camera** facing forward from the brow; **bone-conduction** contact at the temple; a **speaker**; an internal board with the AI processor; a status LED. Shop-floor context: it must look like PPE-grade industrial kit, light and rugged, wearable all shift, compatible with a hairnet/cap. Produce **3 distinct directions** (e.g. A: rigid brow-band with a fixed monocular glass, B: safety-glasses-style wraparound frame with the glass integrated into the right lens, C: a slim halo band with a short fixed temple arm). **None may use a drop-down boom pod like RealWear Arc 3/Navigator.** For the chosen direction, build a **product bible**: front, ¾ front, side, top, back, and 4 detail macros (glass, camera, temple transducer, LED), all with the same materials and the same light. Every later shot of the product is generated from these stills. No text-to-video product shots, because the design would drift.

**Callouts (Act 2).** Built in Remotion (or After Effects-style compositing in code), never by the AI model. A 1 px hairline draws from the proving part to a text block in 10–12 frames (ease-out cubic); title in a neo-grotesk (Inter / Inter Display; or brand font) Medium, cap height ≈ 2.6% of frame height; secondary line Regular at ≈ 1.8%, 70% white. Text sits in the clear negative space of each plate. You measure that space per shot and record it in `plan/shot_list.csv`; text never crosses the product. Hold ≥ 1.6 s readable time; out with a 6-frame fade. Max 2 lines.

**On-glass UI (Act 4).** Designed as *light projected on glass*: thin outlines (2 px at 1080p) with a 6–8 px glow, rounded-corner label chips, slight additive blend, a very subtle chromatic fringe, no hard drop shadows. The verdict chip (`PASS` / `CHECK` / `REJECT`) is the largest element. The outline must **stick to the part**: use OpenCV feature tracking (or planar tracking) on the POV plate and drive the outline from the track data in `gfx/tracks/*.json`. This is why the POV plates must be generated with the hands holding the part fairly steady.

**End cards.** Exactly like the reference: centred, white on pure black, neo-grotesk Regular, cap height ≈ 3% frame height, fades only.

**Grade.** Cool, filmic, deep blacks, gentle halation on speculars, fine grain (unify AI clips with one grain and one LUT pass). Match the reference's contrast and saturation; sample its frames in P0.3 and record target values (mean luma, saturation, black level) in the design bible.

## 6. Sound

**Music (Paras supplies from Envato Elements).** Until it arrives, cut to a click track at 76/152 BPM. When it arrives:
- Run `scripts/beatmap.py` (librosa): BPM, beat grid, downbeats, energy curve, and the drop. Write the results to `plan/music_map.md`.
- If the music's drop is not within 26–29 s, **edit the music** (bar-accurate cuts or a loop of a pre-drop section, crossfaded on a downbeat) so the drop lands on shot 14. Never time-stretch more than ±3%.
- Snap every cut in `plan/shot_list.csv` to the nearest beat or half-beat. Act 1 cuts land on bar lines; the Act 4 montage cuts on beats or half-beats; flash bursts land on the hits.
- Shape the ending: the music decays under shot 27 and is silent from ~58 s, with one soft swell under the name card and one under the logo (use a separate sting if the track has none).

**Sound design** (Envato SFX if Paras provides them; otherwise synthesize or source CC0 and log the licence in `plan/licences.md`): sub impact at 0.0; airy glass shimmer and tonal "tings" on the Act 1 speculars; precise mechanical clicks and seats on every Act 2 assembly; a soft UI "draw" tick for each callout line; an LED power-on tone; low factory ambience in Act 4 (conveyor hum, distant pneumatics) kept *under* the music; UI sounds for outline / PASS (bright two-note) / REJECT (low single note) / photo shutter.

**Voice lines (diegetic, not narration).** Worker: "Reject." (shot 18), "Next." (shot 20). Device voice: "Critical. Arc plate missing." (shot 22). Use TTS (ElevenLabs or Higgsfield audio, whichever is available) unless `INPUTS.md` says Paras will record them. Worker: a natural Indian-English female voice, quiet and matter-of-fact. Device: a calm neutral voice, band-limited (HPF 250 Hz / LPF 6 kHz) and close. Duck the music −6 dB under each line.

**Mix.** −14 LUFS integrated, ≤ −1 dBTP. Export stems.

## 7. Production pipeline (phases)

### P0: Setup and analysis (no paid generation)
1. Check the tools and write the results to `HANDOFF.md`: `ffmpeg`, `ffprobe`, Python 3 + `librosa opencv-python numpy`, Node 18+ and Remotion, Blender (optional), and the **image/video generation MCP** (Higgsfield expected; list the models actually available with `models_explore`). **[BLOCKING]** If no image or video generation tool is reachable, stop and tell Paras exactly what to connect.
2. Read `brief/BRIEF.md` and look at the screenshots. Build `plan/spec_table.md`, the list of claims we may show, each traced to a brief line. Anything not in the brief is not allowed on screen.
3. Read `ref/REFERENCE_ANALYSIS.md`. Then extract reference frames yourself (2 fps sheets plus 25 fps on 29–31.5 s and 33–34 s), check the shot list, and add notes on lens feel, DOF, move speeds (px/s for drifts), and grade targets.
4. Write `plan/shot_list.csv` (one row per shot: id, act, in, out, dur, picture description, method, source stills, camera move, lighting, callout/UI id, sfx cues, negative space box) and `plan/copy.json` (every on-screen string, see §10 defaults).
5. Write `plan/budget.md`: shots × attempts × model cost estimate, with a total.

### P1: Product design and look → **Gate 1**
- Generate the 3 industrial design directions (2 stills each: ¾ hero and worn-on-head) with the image model, using the design bible's lighting.
- Present: the 3 directions, `copy.json`, the shot list summary, the budget estimate, and the music brief (§6) if Paras hasn't picked a track yet.
- Wait for Paras's pick and his edits to the copy.

### P2: Stills and storyboard animatic → **Gate 2**
- Generate the product bible for the chosen design (consistent across all views; use the image model's reference/character-consistency feature with the hero still as reference).
- Generate **one key still per shot** (the start frame; plus an end frame where the move needs one, e.g. assembly shots). People: consistent Indian female worker (same face across shots, built from a reference sheet), a male supervisor, a QC inspector. Factory plates must have **no readable text** (signage gets composited later).
- Build a 60 s **animatic**: the stills on the timeline with simple Ken Burns moves, the click track (or the chosen music), the placeholder callouts, and the UI from Remotion. Render `out/animatic.mp4` plus a contact sheet.
- Present the animatic and wait for approval. Re-ordering and re-timing are cheap here and expensive later.

### P3: Shot generation
- Image → video for every approved still (start frame, plus end frame where needed). Clip length is the shot length + 1 s of handles. Prompts describe **motion only** (the still already defines the look). Example: "slow 15° clockwise rotation, camera slowly pushes in, shallow depth of field, no new objects appear, no text."
- **Assembly shots (5–11):** if the model morphs parts instead of sliding them, switch method after attempt 2: (a) Blender with simple procedural parts lit to match (only if installed), or (b) 2.5D: cut out the part from the still, then animate its position, scale, and motion blur in Remotion over a clean-plate background.
- **Act 1 elements:** Blender is a good fit (simple geometry, glass/metal shaders, deterministic). Use it if available; otherwise image → video.
- Auto-QC each clip (`scripts/verify_shot.py`): duration ≥ needed, 24 fps, resolution, no black or frozen frames, flicker score (frame-to-frame luma delta). Then look at a 6-frame strip of every clip yourself for morphing, extra fingers, warped product geometry, and garbled pseudo-text. Log the verdict per shot in `plan/shot_log.md`.
- Upscale to 1080p (or 4K, then down) only the clips that need it.

### P4: Graphics, edit, and sound → **Gate 3 (rough cut)**
- Remotion compositions: `Callout`, `OnGlassUI`, `Tablet` (report + trend card), `MonitorPhoto`, `EndCards`, all reading from `copy.json` and `plan/` timing. Track the POV plates and drive the UI from the track data.
- Assemble with an ffmpeg filter graph or a Remotion master composition, cut to the beat-snapped shot list. Apply the unified grade, grain, and halation.
- Sound: music edit, SFX, voice lines, mix to spec.
- Render `out/roughcut_v1.mp4` plus the contact sheet. Present and wait for notes.

### P5: Revisions → **Gate 4 (final)**
- **Max 2 revision rounds** after the rough cut. Track each note in `plan/notes_round_N.md` with status. If a note needs regeneration, the 2-attempt limit per shot applies.
- Final render, the FCP7 XML for Premiere, stems, and ProRes 4444 graphics. Run all of §9. Then the 9:16 cut-down if requested.

## 8. Approval gates (what Paras sees)

| Gate | Paras approves | Then you |
|---|---|---|
| 1 | Product design direction · copy.json · budget · music choice | Generate the product bible and key stills |
| 2 | 60 s animatic | Spend credits on video generation |
| 3 | Rough cut with sound | Polish and fix notes (max 2 rounds) |
| 4 | Final | Deliver the master, Premiere XML, stems, and optional 9:16 |

## 9. Verification scripts (all must PASS before Gate 3 and Gate 4)

- `verify_master.py`: duration 58–62 s; 1920×1080; 24 fps CFR; H.264; audio 48 kHz stereo; integrated loudness −14 ±1 LUFS; true peak ≤ −1.0 dBTP (ffmpeg `ebur128=peak=true`).
- `verify_blacks.py`: black frames (`blackdetect`) only in the intended windows (start fade, 53.0–53.5, 55.8–56.2, tail).
- `verify_copy.py`: every string drawn by the graphics code exists in `copy.json`; no hard-coded literals in the Remotion source; no digits in callouts except the illustrative UI data; **banned terms** absent from copy and filenames, matched case-insensitive on word boundaries (so `MPU` and `Arc plate` stay legal): `RealWear, Arc 3, Navigator, Ari OS, ATEX, IP65/IP66/IP67, MIL-STD, accuracy, %, battery, hours, MP, megapixel, GB, VR` (drop `VR` from the list only if INPUTS.md says to keep the brief's "integrated VR" wording).
- `verify_claims.py`: each callout id in copy.json maps to a line in `plan/spec_table.md`.
- `verify_cuts.py`: the detected scene cuts in the render match `shot_list.csv` within ±2 frames; every cut sits within ±1 frame of a beat or half-beat from `music_map.md` (list exceptions with reasons).
- `verify_safe.py`: all text bounding boxes sit inside title-safe (90%) and don't overlap the product mask (stored per shot).
- `verify_xml.py`: the Premiere XML parses, every referenced media file exists, and the timeline duration equals the master duration.
- Always produce `out/contact_sheet.jpg` and **look at it** before declaring a gate ready.

## 10. Defaults (used unless INPUTS.md overrides)

- **Product name:** placeholder `[PRODUCT NAME]` on the name card. **[BLOCKING before final render only]**. You may propose 5 names at Gate 1 (short, ownable, not "Arc"-anything, not a real trademark you can find with a quick search).
- **Logo card:** `brand/logo.svg` if present; otherwise a clean wordmark of the company name in `INPUTS.md`; otherwise skip the logo card and hold the name card longer.
- **Accent colour:** electric blue → teal (§5).
- **Fonts:** Inter / Inter Display (free) unless brand fonts are in `brand/`.
- **Cast and setting:** Indian MCB factory; female assembly worker (late 20s–30s, hair tied back under a cap), male line supervisor, QC inspector; blue/grey ESD coats.
- **Display wording:** the brief says "with integrated VR", but a see-through glass over the real part is AR/assisted reality. Default on-screen wording is **"See-through display"**; don't say VR unless Paras confirms.
- **Budget cap:** if not given, estimate it, present the estimate at Gate 1, and generate nothing paid before approval.
- **Default copy.json:**
```json
{
  "callouts": {
    "display":  {"title": "See-through display", "sub": "Defects outlined over the real part"},
    "ai":       {"title": "On-device AI", "sub": "Real-time inspection. No internet needed.", "sub2": "MPU + MCU"},
    "camera":   {"title": "Inspection camera", "sub": "Every part captured as evidence"},
    "voice":    {"title": "Voice control", "sub": "Bone-conduction mic, noise cancelling"},
    "speaker":  {"title": "Spoken alerts", "sub": "Built-in speakers"},
    "connect":  {"title": "Wi-Fi · On-board memory · GPS tagging", "sub": "Works offline. Syncs when connected."}
  },
  "ui": {
    "defect_1": "Contact tip oxidised",
    "defect_2": "Arc plate missing",
    "verdict_pass": "PASS", "verdict_check": "CHECK", "verdict_reject": "REJECT",
    "toast_photo": "Photo saved · Station 04 · Batch B-2611 · 14:32",
    "station_sign": "Electrical testing",
    "tablet_title": "Shift A · Defects by type",
    "tablet_bars": ["Discolouration", "Wear and tear", "Missing parts", "Print / label"],
    "trend_alert": "Discolouration rising · Station 04"
  },
  "voice": {"worker_1": "Reject.", "worker_2": "Next.", "device_1": "Critical. Arc plate missing."},
  "end": {"name": "[PRODUCT NAME]", "descriptor": "", "logo": "brand/logo.svg"}
}
```

## 11. First actions, right now

1. Read this file, `brief/BRIEF.md`, the brief screenshots, and `ref/REFERENCE_ANALYSIS.md`.
2. Create `HANDOFF.md` with §1 copied in.
3. Run P0 steps 1–5.
4. Reply to Paras with: the tool check results, anything **[BLOCKING]**, your 3-line read of the story, and the Gate 1 package once P1 is done.
