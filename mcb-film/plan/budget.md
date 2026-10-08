# Budget: generation estimate (P0, before any paid call)

**Balance today: 0 credits, free plan** (`balance` tool, 2026-10-08). INPUTS.md gives no cap. Nothing paid runs before Paras sets a cap and funds the workspace (PROMPT §1.7, §10).

## Price assumptions (to confirm with a real quote at the first P1 call)

Higgsfield publishes credits only as plan ratios (`show_plans_and_credits`, 2026-10-08):
- PLUS: 1,000 credits/mo = "600 Nano Banana Pro generations" or "~200 Kling 3.0 videos" → **≈1.7 cr / 2K image**, **≈5 cr / 5 s 720p Kling 3.0 clip**.
- Auto-refill rate: 18 credits per USD (≈ 5.5 ¢ per credit).
- 1080p / pro / Seedance 2.0 std assumed **≈3× the 720p price (≈15 cr / 5 s)** until quoted.
- Plans: PLUS $49/mo (1,000 cr), ULTRA $129/mo (3,000 cr); annual 20–23% cheaper. Rough ₹ at ~84 ₹/$: PLUS ≈ ₹4,100/mo, ULTRA ≈ ₹10,800/mo.

## Estimate by phase

| Phase | Items | Attempts (avg) | Units | Low (720p) | High (1080p) |
|---|---|---|---|---|---|
| P1 directions | 3 directions × 2 stills | 2.0 | 12 images | 20 cr | 20 cr |
| P2 product bible | 9 views | 1.5 | 14 images | 24 cr | 24 cr |
| P2 cast sheets | worker 4, supervisor 2, QC 2 | 1.5 | 12 images | 20 cr | 20 cr |
| P2 key stills | 30 clips → ~34 start/end frames | 1.5 | 51 images | 87 cr | 87 cr |
| P3 clips | 30 generated clips ≤ 5 s | 1.8 | 54 clips | 270 cr | 810 cr |
| P3 upscale | ~10 clips Topaz/Bytedance upscale | 1.0 | 10 | 50 cr | 100 cr |
| P4 TTS | 3 lines × 2 takes | — | 6 audio | 10 cr | 10 cr |
| **Total** | | | | **≈ 480 cr** | **≈ 1,070 cr** |

Clip count (from `shot_list.csv`): shots 1–4 (4), 5–11 (7), 12–16 (6, shot 15 split in two), 17–20 (4), 22–24 (3), 25 (3), 26 (2), 27 (1) = **30**. Shots 21, 28–32 are edit/Remotion only.

Not counted: Blender (not installed, free if Paras installs it; would remove Act 1 and parts of Act 2 from the paid column), music (Envato, Paras), SFX (Envato or CC0).

## Recommendation

Cap **1,200 credits** for the whole film at 1080p-capable models, i.e. ULTRA for one month (3,000 cr, leaves headroom for revisions) or PLUS plus a top-up. If Paras prefers PLUS (1,000 cr), we shoot clips at 720p (low column) and upscale only the hero and POV shots.

## Spend log

| Date | Phase | Batch | Est. cr | Actual cr | Balance after |
|---|---|---|---|---|---|
| 2026-10-08 | P0 | none (unpaid) | 0 | 0 | 0 |
