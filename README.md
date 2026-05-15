# Piano JS

A mini library for demo of using p5js and Tone.js, runnable on mobile devices.

Written by Quang Le

## Web app

Open [index.html](index.html) in a browser (local server recommended for audio samples).

Features:

- Interactive piano keyboard (p5.js canvas)
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

The popup includes a compact one-octave piano, transpose controls, seven scale-degree chord buttons, and the same jazz chord table as the web app (scrollable). Audio samples load from [tonejs.github.io](https://tonejs.github.io/audio/salamander/) (requires network on first use).
