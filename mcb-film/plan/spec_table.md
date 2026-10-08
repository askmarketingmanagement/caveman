# Spec table: claims we may show on screen

Source of truth: `brief/*.png` (screenshots). `brief/BRIEF.md` is the transcription; line refs below point at BRIEF.md sections and the screenshot that carries them. **Anything not in this table does not go on screen.**

Rule reminders (PROMPT §1.2): no figures, percentages, accuracy claims, certifications, battery or weight claims. The brief itself says resolution, megapixels, memory, battery life and weight are not finalised (BRIEF.md "Wearable specification", last line; `4_wearable_spec.png` footer), and detection accuracy is an open point (`5_scope.png`).

## A. Hardware callouts (Act 2, one per shot)

| callout id (copy.json) | On-screen title | Brief wording it comes from | Brief location | Shot |
|---|---|---|---|---|
| `display` | See-through display · Defects outlined over the real part | "Projection onto a see-through glass in front of the eye" · "Shows defect outlines and pass/reject verdicts over the real part" | BRIEF.md § Wearable specification, row Display · `4_wearable_spec.png` | 5 |
| `ai` | On-device AI · Real-time inspection. No internet needed. · MPU + MCU | "AI-enabled on-device processor" · "Detects wear, discolouration and other defects in real time, without internet" · Processor "MPU and MCU" | § Wearable specification rows Edge AI unit + Processor · `4_wearable_spec.png`; also § What we provide "On-device AI inspection… no internet needed on the shop floor" · `1_overview.png` | 6 |
| `camera` | Inspection camera · Every part captured as evidence | "Camera module" · "Captures each part and finished MCB for inspection and photo evidence" | § Wearable specification row Camera · `4_wearable_spec.png` | 7 |
| `voice` | Voice control · Bone-conduction mic, noise cancelling | "Bone-conduction audio with noise cancellation" · "Clear voice commands over factory noise"; "operated by voice, so both hands stay on the assembly" | § Wearable specification row Audio input · `4_wearable_spec.png`; § What we provide · `1_overview.png` | 8 |
| `speaker` | Spoken alerts · Built-in speakers | "High-quality speakers" · "Spoken defect warnings and instructions" | § Wearable specification row Audio output · `4_wearable_spec.png` | 9 |
| `connect` | Wi-Fi · On-board memory · GPS tagging · Works offline. Syncs when connected. | "Wi-Fi via ESP module … Uploads defect records and reports to the cloud" · "On-board memory … Stores inspection records and photos when offline" · "GPS-based data storage … Files records by site and location" | § Wearable specification rows Connectivity, Storage, Location tagging · `4_wearable_spec.png` | 10 |

Deliberately **not** claimed: "integrated VR" (brief row Display). A see-through glass over the real part is assisted reality, not VR; default wording is "See-through display" per PROMPT §10 until Paras says otherwise. Also not claimed: "High-quality" (subjective adjective, dropped to "Built-in").

## B. Software / workflow shown as UI (Act 4)

| copy.json key | On-screen string | Brief wording | Brief location | Shot |
|---|---|---|---|---|
| `ui.defect_1` | Contact tip oxidised | "the defect is named, for example 'Contact tip oxidised.'" · defect table row Contacts: "Blackened, oxidised or tarnished contact surfaces" | § What the worker and quality team get · `3_worker_and_qc.png`; § What it detects · `2_defects_table.png` | 18 |
| `ui.verdict_pass` / `ui.verdict_check` / `ui.verdict_reject` | PASS / CHECK / REJECT | "Pass, check or reject: a clear verdict on each part and each finished MCB" | § What the worker… · `3_worker_and_qc.png` | 18, 20, 22 |
| `ui.toast_photo` | Photo saved · Station 04 · Batch B-2611 · 14:32 | "a photo of every rejected part is saved automatically, with station, batch and time" | § What the worker… (quality team) · `3_worker_and_qc.png` | 18 |
| `ui.station_sign` | Electrical testing | "Visual check of the finished MCB before it goes to electrical testing" · "Electrical checks … stay with the existing test stations" | § Scope · `5_scope.png`; § What it detects footer · `3_worker_and_qc.png` top | 20 |
| `ui.defect_2` | Arc plate missing | "critical defects, such as a missing arc plate, are also announced through the speaker" · defect table row Arc chute: "Missing plates" | § What the worker… · `3_worker_and_qc.png`; `2_defects_table.png` | 22 |
| `ui.tablet_title` + `ui.tablet_bars` | Shift A · Defects by type; bars: Discolouration, Wear and tear, Missing parts, Print / label | "Shift and batch reports: defect counts by type, part and station" · the three defect groups "wear and tear, discolouration, and other part or assembly faults" | § What the worker… · `3_worker_and_qc.png`; § What it detects · `1_overview.png` bottom | 23 |
| `ui.trend_alert` | Discolouration rising · Station 04 | "Trend alerts: a warning when one defect type rises at a station" | § What the worker… · `3_worker_and_qc.png` | 23 |
| (picture only) | rejected-part photo with batch code on a monitor | "Traceability: each defect is linked to its batch code for audits and customer complaints" | § What the worker… · `3_worker_and_qc.png` | 24 |

Illustrative UI data (Station 04, Batch B-2611, 14:32, Shift A) is invented placeholder data, kept identical across every shot (PROMPT §1.5). The tablet bars carry **no numbers**; bar lengths are relative only.

## C. Voice lines (diegetic)

| copy.json key | Line | Brief wording | Location |
|---|---|---|---|
| `voice.worker_1` | Reject. | "Voice control: 'Reject,' 'Recheck' or 'Next' by voice" | `3_worker_and_qc.png` |
| `voice.worker_2` | Next. | same | same |
| `voice.device_1` | Critical. Arc plate missing. | "critical defects, such as a missing arc plate, are also announced through the speaker" | same |

## D. Things the film may *show* but never *say*

- Hands stay on the job (voice/glance only): "operated by voice, so both hands stay on the assembly" · `1_overview.png`. Enforced in every shot (PROMPT §1.6).
- All detection is visual; the finished MCB passes the visual check and goes *to* the electrical test station · `3_worker_and_qc.png`, `5_scope.png` (PROMPT §1.4).
- Audience: assembly-line workers, line supervisors, QC inspectors · `1_overview.png`. This is why the cast is one worker, one supervisor, one QC inspector.
- Parts the device inspects (Act 1 elements): contacts with silver tips, arc chute splitter plates, bimetal strip and trip coil, springs and latch · `2_defects_table.png`.

## E. Banned on screen (verify_copy.py enforces)

RealWear, Arc 3, Navigator, Ari OS, ATEX, IP65/IP66/IP67, MIL-STD, accuracy, %, battery, hours, MP, megapixel, GB, VR. Plus any numeral except inside the illustrative UI strings listed in B.
