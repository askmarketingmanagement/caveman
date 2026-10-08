# Design bible: MCB inspection wearable film

Read with `plan/shot_list.csv`, `plan/copy.json`, `ref/REFERENCE_ANALYSIS.md` (§7 has our measurements). The reference is copied in **craft**, never in object, dock, or name (PROMPT §1.1).

## 1. Palette

| Role | Value | Notes |
|---|---|---|
| Void | `#050608` | Acts 1–3 background. Reference Act 1 is 57% pixels under 16/255 |
| Navy gradient | `#07122B` → `#0B1F4A` | Act 2 backdrop, blooms in from screen-right at the end of Act 1 |
| Product | gunmetal `#2A2E33` / graphite `#1C1F23`, brushed, with `#8A9099` edge speculars | PPE-grade matte, not glossy consumer |
| Accent (one only) | electric blue `#1E6BFF` → teal `#18C3B3` | Default per PROMPT §5 (INPUTS.md gave no brand colours). Used for glow, light sweeps, callout hairline, LED |
| UI pass | `#2BD67B` @ 85% + soft glow | |
| UI check | `#FFB020` @ 85% + soft glow | Also the Act 4 shot-18 outline (amber) |
| UI reject | `#FF3B3B` @ 85% + soft glow | Shot 22 outline (red) |
| Warm | skin, brass/silver contacts, one accent montage shot (magenta/amber, shot 25b) | Nowhere else |
| High-key rest | seamless `#E9E6F0` lavender-white | Shot 27 only. Reference dock shot: mean luma 182/255, HSV sat 30 |
| End cards | `#FFFFFF` on `#000000` | fades only |

Colour-temperature arc (reference, keep): cold void → blue tech → teal human → mixed real world → white rest → black.

## 2. The product (industrial design constraints)

From the brief (`4_wearable_spec.png`, `1_overview.png`): head-mounted; **see-through glass in front of one eye**; forward camera at the brow; bone-conduction contact at the temple; a speaker; internal board with AI processor, MPU/MCU, ESP Wi-Fi module, memory; a status LED. Shop-floor PPE-grade, light, rugged, all-shift wearable, works over a hairnet/cap.

**Hard no:** drop-down boom pod on an articulated arm, RealWear's curved rear band with a frontal pod, their dock shape. Our glass is **fixed** in front of the eye, not hung from a boom.

Three directions to generate at P1 (2 stills each: ¾ hero in void, worn on head):

| Dir | Concept | Where the glass sits | Camera | Transducer | Silhouette risk |
|---|---|---|---|---|---|
| **A** Brow-band | Rigid low-profile brow band (hard-hat-liner feel), fixed monocular glass on a short rigid stub below the brow, right eye | Centre of brow, flush | Right temple pad inside band | Reads clearly as *not* a boom if the stub is short and rigid |
| **B** Wrap frame | Safety-glasses wraparound; the right lens carries the see-through display zone; electronics in a thickened right temple | Top centre of the frame bridge | Right temple tip | Most familiar on a shop floor; risk: too "smart glasses" generic. Differentiate with a visible rugged hinge and a brow bumper |
| **C** Slim halo | Thin halo band around the head with a short fixed temple arm bringing a small glass in front of the right eye | Right side of halo, forward | At the arm root on the temple | Lightest look; risk: reads like a headlamp. Keep the arm short and the glass clearly optical |

Chosen direction → **product bible**: front, ¾ front, side, top, back + 4 detail macros (glass, camera, temple transducer, LED). Same materials, same lighting (top rim + soft blue fill from screen-right, void background), same lens (macro/tele). Every later product shot derives from these stills via image-to-video with reference images. **No text-to-video product shots** (design drift).

## 3. Callouts (Act 2)

Built in Remotion. Never by the AI model.

- Hairline: 1 px, colour accent-teal at 80%, draws from the proving part to the text block in 10–12 frames, ease-out cubic.
- Title: Inter Display Medium, cap height 2.6% of 1080 = **28 px cap height** (≈ 39 px font size for Inter, cap-height ratio 0.727). White.
- Secondary: Inter Regular, cap height 1.8% = **19.4 px cap height** (≈ 27 px font size), 70% white. Max 2 lines.
- `ai` callout: `sub2` ("MPU + MCU") as a third tiny line, Inter Regular 1.4% cap height (≈ 21 px font size), 55% white.
- Readable hold ≥ 1.6 s; out with a 6-frame fade. Text sits in the clear negative space of the plate, measured per shot in P2 and recorded in `shot_list.csv` → `neg_space_box`. Text never crosses the product mask.
- Title-safe: all text inside the central 90% (x 96–1824, y 54–1026).
- Timing: hairline starts the frame the proving part seats (clip-specific, logged in `plan/shot_log.md`).

## 4. On-glass UI (Act 4)

Light projected on glass:
- Outline: 2 px at 1080p, 6–8 px glow (same colour, 40%), rounded corners r=6 px, slight additive blend, subtle chromatic fringe (±1 px R/B offset at 25%), **no drop shadows**.
- Label chip: rounded 8 px, fill white 8%, stroke 1 px white 25%, Inter Medium 22 px, white 90%.
- Verdict chip: largest element; Inter Display Semibold 44 px, letter-spacing 0.06 em, colour = semantic; chip fill = semantic at 18%.
- Toast (shot 18): bottom-left of the display zone, Inter Regular 20 px, 75% white, slides in 8 frames, holds 1.2 s, fades 6 frames.
- Display zone: the glass covers roughly the right 60% × central 55% of the POV frame; UI lives inside it, with a 2% vignette/soft edge so it reads as projected on glass and not burned into the plate.
- Tracking: OpenCV (ORB/KLT planar) on the POV plate; outline driven by `gfx/tracks/<shot>.json` (per-frame quad). POV plates must have steady hands; drift ≤ ~30 px/s.
- Sweep line (shot 20): 1 px teal, 20% glow, crosses the MCB in 14 frames, then PASS chip pops (scale 0.9→1.0, 6 frames).

## 5. Tablet / monitor comps

- Tablet (shot 23): dark UI, `tablet_title` top, 4 horizontal bars (relative lengths 0.72 / 0.48 / 0.31 / 0.19, **no numerals**), trend card `trend_alert` with a small amber rising-arrow glyph. Composited onto the tracked screen with a slight screen-glow and reflection overlay.
- Monitor (shot 24): a photo of a rejected contact assembly (AI still, no text) inside a viewer frame with the `toast_photo` string as caption. Batch code reused verbatim: `B-2611`.

## 6. End cards

Centred, white on pure black, Inter Regular, cap height 3% = **32 px cap height** (≈ 44 px font size). Name card fade 0.5 in / hold 0.8 / 0.8 out. Logo card fade 0.25 in / hold ~3.0 / 0.5 out. Fades only, no motion. If `brand/logo.svg` is absent (it is, today) → clean Inter wordmark of the company name from INPUTS.md; if that is also blank → skip the logo card and hold the name card longer (PROMPT §10).

## 7. Grade targets (measured on the reference, 480×270 downsample, 0–255 scale)

| Window | Mean luma | Mean HSV sat | % pixels < 16 | Highlight p99.5 |
|---|---|---|---|---|
| Act 1 elements | 49 | 82 | 57 | 212 |
| Act 2 assembly | 48 | 106 | 29 | 209 |
| Act 3 reveal + human | 39 | 116 | 31 | 140 |
| Act 4 field | 63 | 105 | 12 | 199 |
| Act 5 rest (high-key) | 182 | 30 | 0 | 242 |

Targets for our grade: match each act within ±8 luma, ±15 sat. Deep blacks (void acts ≥ 50% of pixels under 16/255). Gentle halation on speculars (reference highlights clip softly at ~210–245, never hard 255 except the dock set). One LUT pass + one fine-grain pass (ISO-800-equivalent, monochrome, 1.5% amplitude) across all AI clips to unify them. Verify with `scripts/measure_reference.py`-style sampling on the rough cut.

## 8. Motion targets (median optical-flow of moving pixels, 1080p px/s; p90 = fast layer)

| Reference shot | Median | p90 | Our shot |
|---|---|---|---|
| 1 lens rim (push + rotate) | 4 | 106 | 1 contact tip |
| 2 prism (drift + tumble) | 60 | 118 | 2 arc plates |
| 3 rings (slow orbit) | 1.5 | 10 | 3 bimetal + spring |
| 4 exploded parts (lateral drift) | 10 | 46 | 4 glass pane |
| 5 chassis screws (slide) | 18 | 58 | 5, 10 |
| 6 camera + glass (push) | 0.6 | 20 | 7 |
| 7 hinge LED (tilt) | 1.3 | 46 | 8, 11 |
| 9 hero (product rotates) | 0.1 | 4 | 13 |
| 11 hands (handheld) | 1.7 | 479 | 14 |
| 12 worn (push) | 0.6 | 64 | 15 |
| 16 POV UI | 64 | 139 | 18, 20, 22 (we want *less*: ≤ 30 for tracking) |
| 25 dock (hand places) | 0 | 352 | 27 |

Rule: slow and weighty, ease-in/out on every move, nothing snaps. The product never exceeds ~20 px/s median; only hands and whips go fast.

## 9. Lens / DOF language (from viewing the reference frames)

- Act 1: ~100 mm macro look, razor-thin DOF (only the near edge of a ring is sharp), foreground bokeh discs, specular rims as the main shape-readers.
- Act 2: macro with slightly deeper DOF so the seating part reads; focus racks subtly to the seating point.
- Humans: 50–85 mm equivalent at wide aperture; one strong coloured key (teal) per shot; faces serious, mid-task; eye macros as punctuation (twice).
- Factory: 24–35 mm wides with practicals as light sources; POV shots wide, hands enter from frame bottom; UI occupies the right third in the reference, ours sits in the display zone (§4).
- Whip flash bursts: 2–4-frame micro-cuts with directional motion blur (50–80 px), 0.2–0.4 s total.
