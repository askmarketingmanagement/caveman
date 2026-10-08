# Smart Wearable for MCB Assembly Inspection: Product Brief
Dated Oct 8, 2026. Transcribed verbatim from the client brief screenshots in `brief/`. If this file and the screenshots ever disagree, the screenshots win.

## What we provide
A hands-free smart wearable for workers on the MCB assembly line. It checks each part and each assembled MCB as the worker handles it, and flags wear and tear, discolouration and other defects before the unit moves down the line.

The offering has three parts:
- **The wearable:** a head-mounted device with a camera and a see-through display in front of the eye, operated by voice, so both hands stay on the assembly.
- **On-device AI inspection:** trained on our MCB parts to spot defects in real time, with no internet needed on the shop floor.
- **Quality records:** every finding is logged with a photo, station, batch and time, and rolled up into shift and batch reports.

**Who it is for:** assembly-line workers, line supervisors and quality-control inspectors making MCBs for household and industrial electricity supply.

## What it detects
The system checks the main MCB components and the finished assembly for visible defects in three groups: wear and tear, discolouration, and other part or assembly faults.

| Part or stage | Wear and tear | Discolouration | Other problems |
|---|---|---|---|
| Housing and cover (moulded plastic) | Scratches, chipped edges, cracks | Yellowing, brown or burn marks from moulding | Short shots, flash, warping, sink marks |
| Contacts (fixed and moving, silver tips) | Pitted, worn or chipped contact tips | Blackened, oxidised or tarnished contact surfaces | Missing or misaligned tips, poor brazing or welding |
| Bimetal strip and trip coil | Bent or deformed strip, damaged coil winding | Heat-tinted or oxidised metal | Wrong position, loose joints |
| Arc chute (arc splitter plates) | Bent or damaged plates | Rust or oxidation on plates | Missing plates, wrong count or spacing |
| Springs and latch mechanism | Stretched, bent or fatigued springs | Rust or corrosion | Missing or wrongly seated spring, latch misaligned |
| Terminals and screws | Damaged threads, stripped screw heads | Corroded or tarnished plating | Missing screws, wrong size |
| Toggle (operating knob) | Broken or loose toggle | Faded or off-shade colour | Wrong colour for the rating, toggle stuck |
| Rivets and fasteners | Loose or cracked rivets | Not applicable | Missing or half-set rivets |
| Labels and printing | Smudged or scratched print | Faded print | Wrong rating or curve (B, C, D), missing marks, misprinted batch code |

All detection is visual. Electrical checks, such as trip-time and dielectric tests, stay with the existing test stations.

## What the worker and quality team get
The worker gets an instant pass or reject on each part without stopping work; the quality team gets a full defect record for every shift and batch.

**For the assembly worker:**
- **On-glass alerts:** the defective part is outlined on the display and the defect is named, for example "Contact tip oxidised."
- **Pass, check or reject:** a clear verdict on each part and each finished MCB.
- **Voice control:** "Reject," "Recheck" or "Next" by voice, with both hands on the job.
- **Spoken warnings:** critical defects, such as a missing arc plate, are also announced through the speaker.

**For the quality team and supervisors:**
- **Photo evidence:** a photo of every rejected part is saved automatically, with station, batch and time.
- **Shift and batch reports:** defect counts by type, part and station.
- **Trend alerts:** a warning when one defect type rises at a station, pointing to a worn tool, a bad supplier batch or a moulding issue.
- **Traceability:** each defect is linked to its batch code for audits and customer complaints.

## Wearable specification
The wearable combines an on-glass display, a camera and an on-board AI processor, so inspection runs on the device itself at each assembly station.

| Component | Specification | Role in MCB inspection |
|---|---|---|
| Display | Projection onto a see-through glass in front of the eye, with integrated VR | Shows defect outlines and pass/reject verdicts over the real part |
| Processor | MPU and MCU | Runs the device, camera, display and storage |
| Edge AI unit | AI-enabled on-device processor | Detects wear, discolouration and other defects in real time, without internet |
| Camera | Camera module | Captures each part and finished MCB for inspection and photo evidence |
| Connectivity | Wi-Fi via ESP module | Uploads defect records and reports to the cloud |
| Storage | On-board memory | Stores inspection records and photos when offline |
| Location tagging | GPS-based data storage | Files records by site and location |
| Audio input | Bone-conduction audio with noise cancellation | Clear voice commands over factory noise |
| Audio output | High-quality speakers | Spoken defect warnings and instructions |

Exact figures (display resolution, camera megapixels, memory size, battery life and weight) are still to be finalised.

## Scope
**In scope now:**
- Visual inspection of MCB components at the assembly stations
- Visual check of the finished MCB before it goes to electrical testing
- Defect alerts, photo evidence and quality reports

**Open points:**
- [x] Choose the MCB models, ratings and part list to train the AI on first.
- [ ] Collect sample images of good and defective parts from the line.
- [x] Pick the assembly stations for the pilot.
- [ ] Set the target detection accuracy and acceptable false-reject rate.
