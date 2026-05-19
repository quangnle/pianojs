/** Jazz reharm: chord insertion + color. Requires definitions.js */

const MAJOR_DEGREE_SEMITONES = [
	[0, 'I'],
	[2, 'ii'],
	[4, 'iii'],
	[5, 'IV'],
	[7, 'V'],
	[9, 'vi'],
	[11, 'vii'],
];

function jazzifyParseRoot(chordName) {
	if (typeof parseChordRootAndSuffix === 'function') {
		return parseChordRootAndSuffix(chordName.trim());
	}
	let root = chordName.trim()[0];
	let suffix = chordName.slice(1);
	if (chordName[1] === '#' || chordName[1] === 'b') {
		root += chordName[1];
		suffix = chordName.slice(2);
	}
	return { root, suffix: suffix.replace(/\s/g, '') };
}

function jazzifyRootPc(root) {
	return getKeyPosition(root.split('/')[0]);
}

function jazzifySemitoneFromTonic(chordName, keyRoot) {
	const { root } = jazzifyParseRoot(chordName);
	return (jazzifyRootPc(root) - jazzifyRootPc(keyRoot) + 12) % 12;
}

function jazzifyDetectRoman(chordName, keyRoot) {
	const st = jazzifySemitoneFromTonic(chordName, keyRoot);
	for (let i = 0; i < MAJOR_DEGREE_SEMITONES.length; i++) {
		if (MAJOR_DEGREE_SEMITONES[i][0] === st) {
			return { roman: MAJOR_DEGREE_SEMITONES[i][1], st, chromatic: false };
		}
	}
	return { roman: 'x', st, chromatic: true };
}

function jazzifyNoteAt(keyRoot, semitonesFromTonic) {
	return transpose(keyRoot.split('/')[0], semitonesFromTonic / 2).split('/')[0];
}

function jazzifyBuild(root, suffix) {
	if (typeof buildChordName === 'function') {
		return buildChordName(root, suffix);
	}
	return root.split('/')[0] + suffix;
}

function jazzifyChordAt(keyRoot, semitonesFromTonic, suffix) {
	return jazzifyBuild(jazzifyNoteAt(keyRoot, semitonesFromTonic), suffix);
}

function jazzifyDominantOfSemitone(keyRoot, targetSt) {
	return (targetSt + 7) % 12;
}

function jazzifyIiVBeforeTarget(keyRoot, targetSt, variant) {
	const iiSt = (targetSt + 2) % 12;
	const vSt = jazzifyDominantOfSemitone(keyRoot, targetSt);
	const iiSuffix = variant === 'bold' ? 'm11' : variant === 'medium' ? 'm9' : 'm7';
	const vSuffix = variant === 'bold' ? '7alt' : variant === 'medium' ? '9' : '7';
	return [jazzifyChordAt(keyRoot, iiSt, iiSuffix), jazzifyChordAt(keyRoot, vSt, vSuffix)];
}

function jazzifyIsMinor(chordName) {
	const { suffix } = jazzifyParseRoot(chordName);
	const s = suffix.replace(/\s/g, '');
	if (!s || s === 'm') return !!s;
	if (/^m(?!aj|Maj)/i.test(s) && !/^m7b5/i.test(s)) return true;
	try {
		const seq = matchChordSuffix(s);
		return (
			seq === MINOR ||
			seq === MINOR_6 ||
			seq === MINOR_7 ||
			seq === MINOR_M7 ||
			seq === MINOR_9 ||
			seq === MINOR_11 ||
			seq === MINOR_13 ||
			seq === DIM ||
			seq === DIM7 ||
			seq === M7B5
		);
	} catch (_) {
		return false;
	}
}

function jazzifyIsDominant(chordName) {
	const { suffix } = jazzifyParseRoot(chordName);
	const s = suffix.replace(/\s/g, '');
	if (!s) return false;
	if (s === '7' || /^7/.test(s)) {
		if (/^Maj7|^M7/i.test(s)) return false;
		if (/^m7/i.test(s)) return false;
		return true;
	}
	return false;
}

function jazzifyColor(chordName, keyRoot, variant, index, total, nextChord) {
	const { root } = jazzifyParseRoot(chordName);
	const analysis = jazzifyDetectRoman(chordName, keyRoot);
	const roman = analysis.roman;
	const nextRoman = nextChord ? jazzifyDetectRoman(nextChord, keyRoot).roman : null;
	const rootNote = root.split('/')[0];

	if (analysis.chromatic) {
		if (jazzifyIsDominant(chordName)) return jazzifyBuild(rootNote, variant === 'bold' ? '7alt' : '7');
		if (jazzifyIsMinor(chordName)) return jazzifyBuild(rootNote, variant === 'light' ? 'm7' : 'm9');
		return jazzifyBuild(rootNote, variant === 'light' ? 'Maj7' : 'Maj9');
	}

	let suffix = '';

	if (variant === 'light') {
		switch (roman) {
			case 'I':
				suffix = 'Maj7';
				break;
			case 'ii':
			case 'iii':
			case 'vi':
				suffix = 'm7';
				break;
			case 'IV':
				suffix = '6';
				break;
			case 'V':
				suffix = '7';
				break;
			case 'vii':
				suffix = 'm7b5';
				break;
			default:
				suffix = jazzifyParseRoot(chordName).suffix;
		}
	} else if (variant === 'medium') {
		switch (roman) {
			case 'I':
				suffix = index === total - 1 ? 'Maj9' : 'Maj7';
				break;
			case 'ii':
				suffix = 'm9';
				break;
			case 'iii':
				suffix = 'm9';
				break;
			case 'vi':
				suffix = 'm7';
				break;
			case 'IV':
				suffix = 'Maj7';
				break;
			case 'V':
				suffix = '9';
				break;
			case 'vii':
				suffix = 'm7b5';
				break;
			default:
				suffix = '';
		}
	} else {
		switch (roman) {
			case 'I':
				suffix = 'Maj9';
				break;
			case 'ii':
				suffix = 'm11';
				break;
			case 'iii':
				suffix = 'm9';
				break;
			case 'vi':
				suffix = 'm9';
				break;
			case 'IV':
				suffix = 'Maj9';
				break;
			case 'V':
				suffix = nextRoman === 'I' ? '7alt' : '13';
				break;
			case 'vii':
				suffix = 'm7b5';
				break;
			default:
				suffix = '7';
		}
	}

	return jazzifyBuild(rootNote, suffix);
}

function jazzifyDedupe(list) {
	const out = [];
	for (let i = 0; i < list.length; i++) {
		if (i > 0 && list[i] === list[i - 1]) continue;
		out.push(list[i]);
	}
	return out;
}

/** Chords to insert immediately before the next anchor. */
function jazzifyInsertionsBefore(keyRoot, prevChord, nextChord, variant, nextIndex, total) {
	const nextA = jazzifyDetectRoman(nextChord, keyRoot);
	const prevA = prevChord ? jazzifyDetectRoman(prevChord, keyRoot) : null;
	const nextR = nextA.roman;
	const prevR = prevA ? prevA.roman : null;
	const nextSt = nextA.st;
	const ins = [];

	if (variant === 'light') {
		if (nextR === 'I' && nextIndex === total - 1 && prevR !== 'V') {
			return jazzifyIiVBeforeTarget(keyRoot, 0, 'light');
		}
		return ins;
	}

	if (nextR === 'I') {
		if (prevR !== 'V') {
			ins.push(...jazzifyIiVBeforeTarget(keyRoot, 0, variant));
		} else {
			ins.push(jazzifyChordAt(keyRoot, 2, 'm7'));
			ins.push(
				jazzifyChordAt(keyRoot, 7, variant === 'bold' ? '7alt' : variant === 'medium' ? '9' : '7'),
			);
			if (variant === 'bold') {
				ins.push(jazzifyChordAt(keyRoot, 1, '7'));
			}
		}
	} else if (nextR === 'IV') {
		ins.push(...jazzifyIiVBeforeTarget(keyRoot, 5, variant));
	} else if (nextR === 'V') {
		ins.push(...jazzifyIiVBeforeTarget(keyRoot, 7, variant));
	} else if (nextR === 'iii' && variant === 'bold') {
		ins.push(jazzifyChordAt(keyRoot, jazzifyDominantOfSemitone(keyRoot, 4), '7'));
	} else if (nextR === 'vi' && variant !== 'light') {
		ins.push(jazzifyChordAt(keyRoot, jazzifyDominantOfSemitone(keyRoot, 9), '7'));
	}

	if (prevR === 'IV' && nextR === 'V') {
		ins.unshift(jazzifyChordAt(keyRoot, 6, 'dim7'));
	}

	if (prevR === 'iii' && nextR === 'IV' && variant === 'bold') {
		ins.push(jazzifyChordAt(keyRoot, jazzifyDominantOfSemitone(keyRoot, 4), '7'));
	}

	if (prevR === 'vi' && nextR === 'ii' && variant === 'bold') {
		ins.push(jazzifyChordAt(keyRoot, jazzifyDominantOfSemitone(keyRoot, 9), '7'));
	}

	return jazzifyDedupe(ins);
}

/**
 * Expand progression with inserted approach chords + colored anchors.
 * @returns {{ chord: string, kind: 'anchor'|'insert', from?: number }[]}
 */
function jazzifyExpandSteps(chords, keyRoot, variant) {
	const key = keyRoot.split('/')[0];
	const steps = [];

	for (let i = 0; i < chords.length; i++) {
		if (i > 0) {
			const insertions = jazzifyInsertionsBefore(
				key,
				chords[i - 1],
				chords[i],
				variant,
				i,
				chords.length,
			);
			for (let j = 0; j < insertions.length; j++) {
				steps.push({ chord: insertions[j], kind: 'insert' });
			}
		}

		const colored = jazzifyColor(chords[i], key, variant, i, chords.length, chords[i + 1] || null);
		steps.push({ chord: colored, kind: 'anchor', from: i });
	}

	return steps;
}

/**
 * @param {string[]} chords
 * @param {string} keyRoot
 * @returns {{ id: string, label: string, description: string, chords: string[], steps: object[] }[]}
 */
function jazzifyProgression(chords, keyRoot) {
	const clean = chords.map((c) => c.trim()).filter(Boolean);
	if (!clean.length) return [];

	const key = keyRoot.split('/')[0];
	const variants = [
		{
			id: 'light',
			label: 'Light',
			description: '7ths on song chords + ii–V before the final tonic.',
		},
		{
			id: 'medium',
			label: 'Medium',
			description: 'Inserts ii–V toward I, IV, and V; richer 7ths on anchors.',
		},
		{
			id: 'bold',
			label: 'Bold',
			description: 'More ii–V, secondary dominants, dim passing, tritone sub to I.',
		},
	];

	return variants.map((v) => {
		const steps = jazzifyExpandSteps(clean, key, v.id);
		return {
			id: v.id,
			label: v.label,
			description: v.description,
			chords: steps.map((s) => s.chord),
			steps,
		};
	});
}

if (typeof window !== 'undefined') {
	window.jazzifyProgression = jazzifyProgression;
}
