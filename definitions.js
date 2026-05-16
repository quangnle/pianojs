const Vol = new Tone.Volume().toDestination();
Vol.volume.value = 5;
const Sampler = new Tone.Sampler({
	urls: {
		"C4": "C4.mp3",
		"D#4": "Ds4.mp3",
		"F#4": "Fs4.mp3",
		"A4": "A4.mp3",
	},
	release: 1,
	baseUrl: "https://tonejs.github.io/audio/salamander/",
}).connect(Vol).toDestination();

const NOTES = ['C', 'C#/Db', 'D', 'D#/Eb', 'E', 'F', 'F#/Gb', 'G', 'G#/Ab', 'A', 'A#/Bb', 'B'];

const MAJOR = [1, 3, 4.5];
const MINOR = [1, 2.5, 4.5];
const MAJOR_6 = [1, 3, 4.5, 5.5];
const MINOR_6 = [1, 2.5, 4.5, 5.5];
const MAJOR_7 = [1, 3, 4.5, 6];
const MINOR_7 = [1, 2.5, 4.5, 6];
const MAJOR_M7 = [1, 3, 4.5, 6.5];
const MINOR_M7 = [1, 2.5, 4.5, 6.5];
const MAJOR_9 = [1, 3, 4.5, 6, 8];
const MINOR_9 = [1, 2.5, 4.5, 6, 8];
const MAJOR_11 = [1, 3, 4.5, 6, 8, 9.5];
const MINOR_11 = [1, 2.5, 4.5, 6, 8, 9.5];
const MAJOR_13 = [1, 3, 4.5, 6, 8, 9.5, 11];
const MINOR_13 = [1, 2.5, 4.5, 6, 8, 9.5, 11];
const MAJOR_69 = [1, 3, 4.5, 5.5, 8];
const MINOR_69 = [1, 2.5, 4.5, 5.5, 8];
const ADD9 = [1, 3, 4.5, 8];
const MAJ7_SHARP11 = [1, 3, 4.5, 6.5, 10];
const DOM7_SUS4 = [1, 3.5, 4.5, 6];
const DOM7_B9 = [1, 3, 4.5, 6, 7.5];
const DOM7_SHARP9 = [1, 3, 4.5, 6, 8.5];
const DOM7_SHARP11 = [1, 3, 4.5, 6, 10];
const DOM7_B13 = [1, 3, 4.5, 6, 10.5];
const DOM7_ALT = [1, 3, 4, 4.5, 6, 7.5, 8.5, 10];
const AUG = [1, 3, 5];
const AUG7 = [1, 3, 5, 6];
const DIM = [1, 2.5, 4];
const DIM7 = [1, 2.5, 4, 6];
const SUS_2 = [1, 2, 4.5];
const SUS_4 = [1, 3.5, 4.5];
const M7B5 = [1, 2.5, 4, 6.5];

const CHORD_SUFFIX_MAP = [
	{ suffix: '7alt', seq: DOM7_ALT },
	{ suffix: '7sus4', seq: DOM7_SUS4 },
	{ suffix: '7sus', seq: DOM7_SUS4 },
	{ suffix: 'M7#11', seq: MAJ7_SHARP11 },
	{ suffix: 'Maj7#11', seq: MAJ7_SHARP11 },
	{ suffix: 'm7b5', seq: M7B5 },
	{ suffix: 'mM7', seq: MINOR_M7 },
	{ suffix: 'Maj13', seq: MAJOR_13 },
	{ suffix: 'Maj9', seq: MAJOR_9 },
	{ suffix: 'Maj7', seq: MAJOR_M7 },
	{ suffix: 'dim7', seq: DIM7 },
	{ suffix: 'aug7', seq: AUG7 },
	{ suffix: '7b13', seq: DOM7_B13 },
	{ suffix: '7#11', seq: DOM7_SHARP11 },
	{ suffix: '7#9', seq: DOM7_SHARP9 },
	{ suffix: '7b9', seq: DOM7_B9 },
	{ suffix: 'm13', seq: MINOR_13 },
	{ suffix: 'm11', seq: MINOR_11 },
	{ suffix: 'm69', seq: MINOR_69 },
	{ suffix: 'm9', seq: MINOR_9 },
	{ suffix: 'm7', seq: MINOR_7 },
	{ suffix: 'm6', seq: MINOR_6 },
	{ suffix: 'add9', seq: ADD9 },
	{ suffix: 'sus4', seq: SUS_4 },
	{ suffix: 'sus2', seq: SUS_2 },
	{ suffix: 'dim', seq: DIM },
	{ suffix: '-7', seq: DIM7 },
	{ suffix: '+7', seq: AUG7 },
	{ suffix: 'aug', seq: AUG },
	{ suffix: '+', seq: AUG },
	{ suffix: '-', seq: DIM },
	{ suffix: '69', seq: MAJOR_69 },
	{ suffix: '13', seq: MAJOR_13 },
	{ suffix: '11', seq: MAJOR_11 },
	{ suffix: '9', seq: MAJOR_9 },
	{ suffix: 'M7', seq: MAJOR_M7 },
	{ suffix: '7', seq: MAJOR_7 },
	{ suffix: '6', seq: MAJOR_6 },
	{ suffix: 'm', seq: MINOR },
	{ suffix: '', seq: MAJOR },
];

let globalTranspose = 0;

function getGlobalTranspose() {
	return globalTranspose;
}

function setGlobalTranspose(val) {
	globalTranspose = val;
	if (typeof window !== 'undefined' && window.pianoui) {
		window.pianoui.currentTranspose = val;
	}
	if (typeof updateTransposeDisplay === 'function') {
		updateTransposeDisplay();
	}
	if (typeof renderChordTable === 'function') {
		renderChordTable();
	}
	if (typeof renderDegreeRow === 'function') {
		renderDegreeRow();
	}
}

function getCurrentKey() {
	return transpose('C', globalTranspose).split('/')[0];
}

function getCurrentKeyLabel() {
	return getCurrentKey() + ' major';
}

function applyTransposeToNote(noteWithOctave) {
	const match = noteWithOctave.match(/^([A-G][#b]?)(\d+)$/);
	if (!match) return noteWithOctave;
	const noteName = match[1];
	const octave = parseInt(match[2], 10);
	const pos = getKeyPosition(noteName);
	if (pos === undefined) return noteWithOctave;
	const semitones = Math.round(globalTranspose * 2);
	const total = pos + semitones;
	const newPos = ((total % 12) + 12) % 12;
	const newOctave = octave + Math.floor(total / 12);
	const newName = NOTES[newPos].split('/')[0];
	return newName + newOctave;
}

function applyTransposeToChordName(chordName) {
	let root = chordName[0];
	let rest = chordName.slice(1);
	if (chordName[1] === '#' || chordName[1] === 'b') {
		root += chordName[1];
		rest = chordName.slice(2);
	}
	const newRoot = transpose(root, globalTranspose).split('/')[0];
	return newRoot + rest;
}

function ensureAudioStarted() {
	if (typeof Tone === 'undefined') return;
	// Begin resume synchronously inside the user-gesture stack (e.g. touchstart); Tone.start() completes async.
	if (Tone.context.state !== 'running') {
		void Tone.context.resume();
		Tone.start();
	}
}

function highlightChordOnPiano(noteKeys) {
	if (typeof window !== 'undefined' && window.pianoui) {
		window.pianoui.setHighlightedNotes(noteKeys);
	}
}

function clearChordHighlightOnPiano() {
	if (typeof window !== 'undefined' && window.pianoui) {
		window.pianoui.clearHighlights();
	}
}

function playSound(keys, delay) {
	ensureAudioStarted();
	clearChordHighlightOnPiano();
	const list = Array.isArray(keys) ? keys : [keys];
	const transposed = list.map(applyTransposeToNote);
	Tone.loaded().then(() => {
		Sampler.triggerAttackRelease(transposed, delay);
	});
}

function playChord(name, delay) {
	ensureAudioStarted();
	// Chord labels already use getCurrentKey() — do not transpose the name again
	const keys = getKeysFromChord(name);
	highlightChordOnPiano(keys);
	Tone.loaded().then(() => {
		Sampler.triggerAttackRelease(keys, delay);
	});
}

function getKeysFromChordName(name) {
	return getKeysFromChord(name);
}

function getKeyPosition(name) {
	name = name.split('/')[0];
	for (let i = 0; i < NOTES.length; i++) {
		const names = NOTES[i].split('/');
		for (let j = 0; j < names.length; j++) {
			if (name === names[j]) return i;
		}
	}
}

function transpose(note, val) {
	const pos = getKeyPosition(note);
	return NOTES[(pos + NOTES.length + (val * 2)) % NOTES.length];
}

function matchChordSuffix(name) {
	const sorted = CHORD_SUFFIX_MAP.slice().sort((a, b) => b.suffix.length - a.suffix.length);
	for (let i = 0; i < sorted.length; i++) {
		if (name === sorted[i].suffix) {
			return sorted[i].seq;
		}
	}
	return MAJOR;
}

function getKeysFromChord(name) {
	let root = name[0];
	if (name[1] === '#' || name[1] === 'b') {
		root += name[1];
		name = name.slice(2);
	} else {
		name = name.slice(1);
	}

	name = name.replace(/\s/g, '');
	const seq = matchChordSuffix(name);

	const notes = [];
	for (let i = 0; i < seq.length; i++) {
		const note = transpose(root, seq[i] - 1).split('/')[0] + '4';
		notes.push(note);
	}
	return notes;
}
