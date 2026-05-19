/** Chord voicing with pitch roles for arpeggio patterns. Requires definitions.js loaded first. */

const ROLE_FALLBACK = {
	root: ['root'],
	third: ['third', 'second', 'fourth'],
	fifth: ['fifth', 'sharpFifth', 'dimFifth', 'fourth'],
	seventh: ['seventh', 'majorSeventh', 'sixth'],
	ninth: ['ninth', 'flatNinth', 'sharpNinth', 'seventh'],
	eleventh: ['eleventh', 'sharpEleventh', 'ninth'],
	thirteenth: ['thirteenth', 'flatThirteenth', 'eleventh', 'ninth'],
};

function roleFromInterval(interval) {
	if (interval === 1) return 'root';
	if (interval === 2) return 'second';
	if (interval === 2.5) return 'third';
	if (interval === 3) return 'third';
	if (interval === 3.5) return 'fourth';
	if (interval === 4) return 'dimFifth';
	if (interval === 4.5) return 'fifth';
	if (interval === 5) return 'sharpFifth';
	if (interval === 5.5) return 'sixth';
	if (interval === 6) return 'seventh';
	if (interval === 6.5) return 'majorSeventh';
	if (interval === 7.5) return 'flatNinth';
	if (interval === 8) return 'ninth';
	if (interval === 8.5) return 'sharpNinth';
	if (interval === 9.5) return 'eleventh';
	if (interval === 10) return 'sharpEleventh';
	if (interval === 10.5) return 'flatThirteenth';
	if (interval === 11) return 'thirteenth';
	return 'other';
}

function parseChordRootAndSuffix(chordName) {
	let root = chordName[0];
	let suffix = chordName.slice(1);
	if (chordName[1] === '#' || chordName[1] === 'b') {
		root += chordName[1];
		suffix = chordName.slice(2);
	}
	return { root, suffix: suffix.replace(/\s/g, '') };
}

function getChordSeq(chordName) {
	const { root, suffix } = parseChordRootAndSuffix(chordName);
	return { root, suffix, seq: matchChordSuffix(suffix) };
}

function getChordVoicing(chordName) {
	const { root, seq } = getChordSeq(chordName);
	const notes = [];
	for (let i = 0; i < seq.length; i++) {
		const interval = seq[i];
		const noteName = transpose(root, interval - 1).split('/')[0];
		notes.push({
			pitch: noteName + '4',
			role: roleFromInterval(interval),
			interval,
			degreeIndex: i,
		});
	}
	return { name: chordName, notes };
}

function pickNoteForRole(voicing, role) {
	const aliases = ROLE_FALLBACK[role] || [role];
	for (let a = 0; a < aliases.length; a++) {
		const found = voicing.notes.find((n) => n.role === aliases[a]);
		if (found) return found.pitch;
	}
	if (voicing.notes.length) return voicing.notes[0].pitch;
	return null;
}

function spreadVoicingOctaves(voicing) {
	// Keep root/inner in octave 4 (same register as block chords + piano middle).
	// Extensions in 5 only — avoids pitching Salamander samples down to octave 3.
	const roleOctave = {
		root: 4,
		second: 4,
		third: 4,
		fourth: 4,
		dimFifth: 4,
		fifth: 4,
		sharpFifth: 4,
		sixth: 4,
		seventh: 4,
		majorSeventh: 4,
		flatNinth: 5,
		ninth: 5,
		sharpNinth: 5,
		eleventh: 5,
		sharpEleventh: 5,
		flatThirteenth: 5,
		thirteenth: 5,
		other: 4,
	};
	const out = [];
	for (let i = 0; i < voicing.notes.length; i++) {
		const n = voicing.notes[i];
		const m = n.pitch.match(/^([A-G][#b]?)(\d+)$/);
		if (!m) {
			out.push({ ...n });
			continue;
		}
		const oct = roleOctave[n.role] != null ? roleOctave[n.role] : 4;
		out.push({ ...n, pitch: m[1] + oct });
	}
	return { name: voicing.name, notes: out };
}

function getSpreadChordVoicing(chordName) {
	return spreadVoicingOctaves(getChordVoicing(chordName));
}
