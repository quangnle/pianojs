# Piano JS

A mini library for demo of using Tone.js with an HTML/CSS piano keyboard, runnable on mobile devices.

Written by Quang Le

## Web app

Open [index.html](index.html) in a browser via a **local HTTP server** (e.g. `npx serve .` or Live Server). Piano samples live in [audio/](audio/) and are decoded into RAM on page load.

Features:

- Interactive piano keyboard (HTML/CSS, no canvas framework)
- Global transpose in half-step increments (±0.5 tone per click)
- Seven diatonic chord buttons for the current key (I–VII)
- Jazz chord reference for the current key (extensions, altered dominants, sus, 6/9, etc.)

## Chrome extension

The extension lives in [plugin-component/](plugin-component/).

### Install (unpacked)

1. Open `chrome://extensions`
2. Enable **Developer mode**
3. Click **Load unpacked**
4. Select the `plugin-component` folder in this repo
5. Click the extension icon to open the piano popup

The popup includes the same HTML keyboard (multi-octave), transpose controls, scale-degree slots with drag-from-library chords, and the same jazz chord table as the web app (scrollable). Audio uses bundled Salamander samples in `plugin-component/audio/` (decoded into RAM on open; no network required).
