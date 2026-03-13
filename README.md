# Landolt C Vision Test

A real-time, tablet-based Landolt C visual acuity test built to the **ISO 8596:2017** standard.

A clinician controls the test from any phone or laptop while the stimulus displays full-screen on a dedicated tablet — optimised for the **Boox Mini Tab 7.8″** e-ink display at 300 PPI. An **Arduino-controlled motorised  slider** automatically positions the display at the correct test distance.

---

## How it works

```
Clinician (phone / laptop)         Tablet / display screen
┌──────────────────────┐           ┌────────────────────────┐
│   controller.html    │──Socket──▶│     display.html       │
│  Pick distance       │           │  ISO 8596 Landolt C    │
│  Set angular size    │           │  centred, full-screen  │
│  Show / Blank        │           │  auto-rotates every Xs │
│  Record ✓ / ✗        │◀─status───│                        │
└──────────────────────┘           └────────────────────────┘
             │
        server.js
    (Node + Express
      + Socket.io)
             │
     Arduino (USB Serial)
     TMC2208 + NEMA17
     motorised  slider
```

The server keeps display and controller sockets in separate sets — only controllers can send commands. The controller connects directly to the Arduino over **Web Serial** (Chrome/Edge only) and drives the slider to the selected test distance automatically.

---

## Optotype — ISO 8596:2017

The Landolt C is a mathematically exact inline SVG path built directly from:

> ISO 8596:2017 — *Ophthalmic optics — Visual acuity testing*
> https://www.iso.org/standard/69042.html

| Property | Value |
|---|---|
| Outer diameter | D (reference unit) |
| Stroke width | D / 5 |
| Gap width | D / 5 |
| Gap edges | Parallel horizontal straight lines |

SVG path (centred at 0,0; gap at 3 o'clock; viewBox 0 0 200 200):
```
M 97.9796,20 A 100,100 0 1,1 97.9796,-20 L 56.5685,-20 A 60,60 0 1,0 56.5685,20 Z
```

Zero rendering artefacts — no canvas rasterisation, no image scaling — the browser's vector engine draws at native resolution.

---

## Pre-calibrated distances

Each distance uses α = 2 · arctan(s / 2d) to hold exactly ~50 arcmin gap:

| Distance | Outer ⌀ | Gap | Snellen |
|---|---|---|---|
| 45 cm | 6.55 mm | 50.04′ | 6/300 |
| 58 cm | 8.44 mm | 50.02′ | 6/300 |
| 81 cm | 11.78 mm | 49.99′ | 6/300 |
| 130 cm | 18.91 mm | 50.01′ | 6/300 |

The angular size slider lets you vary freely for threshold testing with live Snellen / logMAR readout.

---

## Hardware

| Component | Spec |
|---|---|
| Microcontroller | Arduino Uno / Mega |
| Driver | TMC2208 standalone (MS1=LOW MS2=LOW → 8× microstep) |
| Motor | Creality 42-34 NEMA17 — 1.8°/step, 0.8A |
| Belt | GT2, 21-tooth pulley, 130 cm rail |
| Resolution | 380.95 steps/cm |
| Limit switches | A4 (home/130 cm), A5 (min/0 cm) |
| Display tablet | Boox Mini Tab 7.8″ at 300 PPI |

### Arduino firmware

The Arduino sketch and all supporting files are in the `arduino/Slider/` folder of this repo.

> 📦 **Full Arduino + TMC2208 project (schematic, wiring, code):**
> [github.com/ajeemfarook/Arduino-TMC2208.V2-Stepper](https://github.com/ajeemfarook/Arduino-TMC2208.V2-Stepper)

### Serial protocol

| Direction | Command | Description |
|---|---|---|
| → Arduino | `HOME` | Return to 130 cm (home switch) |
| → Arduino | `GOTO <cm>` | Move to position in cm |
| → Arduino | `JOG_FWD` | Step 0.05 cm closer to patient |
| → Arduino | `JOG_BWD` | Step 0.05 cm farther from patient |
| → Arduino | `ESTOP` | Emergency stop |
| → Arduino | `ESTOP_CLEAR` | Clear emergency stop |
| → Arduino | `STATUS` | Request current position |
| ← Arduino | `POS:<cm>` | Position report (sent during and after moves) |
| ← Arduino | `ESTOP` | Confirms emergency stop active |
| ← Arduino | `READY` | Ready after ESTOP_CLEAR |
| ← Arduino | `WARN:<text>` | Soft limit or other warning |

---

## Requirements

- **Node.js ≥ 16**
- **Controller browser:** Chrome or Edge (desktop) — required for Web Serial API
- **Display:** Boox Mini Tab 7.8″ at 300 PPI (or update `DEVICE_PPI` in `display.html`)
- **Font (optional):** Optician Sans → `public/fonts/Optician-Sans.otf`

---

## Installation & running

```bash
# 1. Clone
git clone https://github.com/YOUR_USERNAME/landolt-c-test.git
cd landolt-c-test

# 2. Install
npm install

# 3. Run
npm start
# → http://localhost:3000
```

### Windows — double-click launcher
Double-click `START.bat` — installs dependencies on first run, then starts the server and opens the browser automatically.

---

## Building standalone binaries (no Node.js required)

The HTML is **inlined directly inside `server.js`** at source level, so `pkg` can bundle everything into a single executable with no external file dependencies.

```bash
npm run build
# → dist/server-macos    (Apple Silicon M1/M2 — arm64)
# → dist/server-win.exe  (Windows x64)
# → dist/server-linux    (Linux x64)
```

> **First build on M1 Mac:** run `rm -rf ~/.pkg-cache` before `npm run build` to ensure the correct arm64 Node binary is downloaded.

The `dist/` binaries are self-contained — copy to any machine and run. No Node.js installation needed.

---

## Usage

### Step 1 — Display screen (tablet)
Open in browser:
```
http://YOUR_SERVER_IP:3000/
```
Dark screen with faint "Awaiting signal…" text appears.

### Step 2 — Controller (phone / laptop)
Open in **Chrome or Edge**:
```
http://YOUR_SERVER_IP:3000/controller
```
The green dot confirms the display is connected.

### Step 3 — Connect Arduino slider (optional)
Click **Connect** in the "Tablet Position" panel → select the Arduino serial port. The slider position readout shows live position in cm (e.g. `81.10 cm`). Selecting a distance card automatically moves the slider.

> **Emergency stop:** The ⛔ STOP button remains active at all times when the Arduino is connected — it is never disabled during a move.

### Step 4 — Run a trial

| Action | How |
|---|---|
| Pick distance | Tap 45 / 58 / 81 / 130 cm card |
| Adjust size | Slider or ±0.05° / ±0.1° buttons |
| Set contrast | White-on-black or black-on-white |
| Set orientation | ↑ ↓ ← → fixed, or ↺ random |
| Show | ▶ Show button or `Space` |
| Auto-rotate | On by default — rotates every 2 s (adjustable) |
| Record | ✓ Correct (`C` key) or ✗ Wrong (`X` key) |
| Blank | ⬛ Blank (`B` key) |

### Step 5 — Save session
Enter patient name/ID → **Save ↓** → saved to `logs/session_TIMESTAMP.json`.

---

## Keyboard shortcuts

| Key | Action |
|---|---|
| `Space` | Show stimulus |
| `B` | Blank screen |
| `C` | Correct |
| `X` | Wrong |
| `↑` / `↓` | Angular size ±0.05° |
| `D` | Toggle day / night theme |

---

## Project structure

```
landolt-c-test/
├── server.js              Node + Express + Socket.io (HTML inlined)
├── package.json
├── START.bat              Windows double-click launcher
├── .gitignore
├── README.md
├── arduino/
│   └── Slider/
│       ├── Slider.ino
│       ├── WebSerial.h
│       ├── calib.h
│       └── config.h
├── public/                Source HTML (used by npm start)
│   ├── display.html
│   ├── controller.html
│   └── fonts/
│       └── Optician-Sans.otf   ← add manually
├── dist/                  Built binaries (git-ignored)
└── logs/                  Session JSON files (git-ignored)
```

> **Note on building:** `server.js` contains both HTML files inlined as string literals — this is what allows `pkg` to bundle them reliably. If you edit `public/controller.html` or `public/display.html`, update the corresponding string in `server.js` before running `npm run build`.

---

## Adding Optician Sans font

1. Download from https://optician-sans.com/
2. Place at `public/fonts/Optician-Sans.otf`
3. Restart the server — no code changes needed

Falls back to Courier New / monospace if absent.

---

## Changing display device PPI

Edit line ~9 in `public/display.html`:
```js
const DEVICE_PPI = 300;  // ← your screen's PPI
```

| Device | PPI |
|---|---|
| Boox Mini Tab 7.8″ B/W | 300 |
| Boox Mini Tab 7.8″ Colour | 150 |
| iPad Pro 12.9″ | 264 |
| iPad Air | 264 |
| 24″ 1080p monitor | ~92 |

---

## API

| Method | Path | Description |
|---|---|---|
| `POST` | `/api/save-session` | Save session to `logs/` |
| `GET` | `/api/sessions` | List all saved sessions |

---

## Socket events

| Direction | Event | Payload |
|---|---|---|
| Client → Server | `register` | `'display'` or `'controller'` |
| Controller → Server | `command` | `{ type, ...params }` |
| Server → Display | `command` | forwarded command |
| Server → Controller | `status` | `{ displays: N }` |
| Controller → Server | `slider_position` | `{ cm: N }` |
| Server → Controllers | `slider_position` | `{ cm: N }` |

### Command types

| `type` | Parameters | Effect |
|---|---|---|
| `show` | `distM, angSizeDeg, orientation, negativeContrast` | Show Landolt C |
| `blank` | — | Clear screen |
| `rotate` | `orientation` | Update rotation only (no flicker) |
| `config` | `distM?, angSizeDeg?` | Update params without showing |

---

## License

MIT — free to use, modify, distribute.

Landolt C geometry derived from ISO 8596:2017.
SVG path construction based on Wikimedia Commons Landolt_C.svg (public domain / CC0).
