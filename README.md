# Landolt C Vision Test

A real-time, tablet-based **Landolt C visual acuity test** built to the **ISO 8596:2017** standard.

A clinician controls the test from any phone or laptop while the stimulus displays full-screen on a dedicated tablet — optimised for the **Boox Mini Tab 7.8″** e-ink display at 300 PPI.

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
```

The server keeps **display** and **controller** sockets in separate sets — only controllers can send commands.

---

## Optotype — ISO 8596:2017

The Landolt C is a **mathematically exact inline SVG path** built directly from:

> **ISO 8596:2017** — *Ophthalmic optics — Visual acuity testing*  
> https://www.iso.org/standard/69042.html

| Property | Value |
|---|---|
| Outer diameter | D (reference unit) |
| Stroke width | D / 5 |
| Gap width | D / 5 |
| Gap edges | Parallel horizontal straight lines |

SVG path (centred at 0,0; gap at 3 o'clock; viewBox `0 0 200 200`):

```
M 97.9796,20 A 100,100 0 1,1 97.9796,-20 L 56.5685,-20 A 60,60 0 1,0 56.5685,20 Z
```

This produces zero rendering artefacts — no canvas rasterisation, no image scaling — the browser's vector engine draws it at native resolution.

---

## Pre-calibrated distances

Each distance uses the formula `α = 2 · arctan(s / 2d)` to hold exactly **~50 arcmin** gap:

| Distance | Outer ⌀ | Gap | Snellen |
|---|---|---|---|
| 45 cm | 6.55 mm | 50.04′ | 6/300 |
| 58 cm | 8.44 mm | 50.02′ | 6/300 |
| 81 cm | 11.78 mm | 49.99′ | 6/300 |
| 130 cm | 18.91 mm | 50.01′ | 6/300 |

The angular size slider lets you vary freely for threshold testing with live Snellen / logMAR readout.

---

## Requirements

- **Node.js** ≥ 16
- **Display**: Boox Mini Tab 7.8″ at 300 PPI (or update `DEVICE_PPI` in `display.html`)
- **Controller**: Any phone, tablet, or laptop on the same Wi-Fi network
- **Font** *(optional)*: [Optician Sans](https://optician-sans.com/) → `public/fonts/Optician-Sans.otf`

---

## Installation

```bash
# 1. Clone
git clone https://github.com/YOUR_USERNAME/landolt-c-test.git
cd landolt-c-test

# 2. Install
npm install

# 3. Run
npm start
# → Server running on http://localhost:3000
```

---

## Usage

### Step 1 — Display screen (tablet)
Open in browser:
```
http://YOUR_SERVER_IP:3000/
```
Dark screen appears with faint "Awaiting signal…" text.

### Step 2 — Controller (your phone/laptop)
Open in browser:
```
http://YOUR_SERVER_IP:3000/controller
```
The green dot confirms the display is connected.

### Step 3 — Run a trial

| Action | How |
|---|---|
| Pick distance | Tap 45 / 58 / 81 / 130 cm |
| Adjust size | Slider or ±0.05° / ±0.1° buttons |
| Set contrast | White-on-black or black-on-white |
| Set orientation | ↑ ↓ ← → fixed, or ↺ random |
| **Show** | **▶ Show** button or `Space` |
| Auto-rotate | On by default — rotates every 2 s (adjustable) |
| Record | **✓ Correct** (`C` key) or **✗ Wrong** (`X` key) |
| Blank | **⬛ Blank** (`B` key) |

### Step 4 — Save session
Enter patient name/ID, tap **Save ↓** → saved to `logs/session_TIMESTAMP.json`.

---

## Keyboard shortcuts (controller)

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
├── server.js              Node + Express + Socket.io
├── package.json
├── .gitignore
├── README.md
├── public/
│   ├── display.html       Full-screen display (tablet)
│   ├── controller.html    Clinician control panel
│   └── fonts/
│       └── Optician-Sans.otf   ← add manually (see below)
└── logs/                  Session JSON files (git-ignored)
```

---

## Adding Optician Sans font

1. Download the free font from https://optician-sans.com/
2. Place the file at `public/fonts/Optician-Sans.otf`
3. Restart the server — no code changes needed

Falls back to `Courier New` / monospace if absent.

---

## Changing display device PPI

Edit line ~9 in `public/display.html`:

```js
const DEVICE_PPI = 300;  // ← your screen's PPI
```

| Device | PPI |
|---|---|
| Boox Mini Tab 7.8″ B/W | **300** |
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

Landolt C geometry derived from **ISO 8596:2017**.  
SVG path construction based on [Wikimedia Commons Landolt_C.svg](https://commons.wikimedia.org/wiki/File:Landolt_C.svg) (public domain / CC0).
