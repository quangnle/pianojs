# Piano samples (Salamander sparse set)

Four MP3 files from the [Tone.js Salamander](https://github.com/Tonejs/Tone.js/tree/master/examples/audio/salamander) demo pack:

- `C4.mp3`, `Ds4.mp3`, `Fs4.mp3`, `A4.mp3`

The app fetches these at startup, decodes them with `AudioContext.decodeAudioData`, and keeps the resulting `AudioBuffer` objects in memory for `Tone.Sampler`. Other pitches are pitch-shifted from these four notes.

The extension ships a copy under `plugin-component/audio/`.
