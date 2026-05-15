// Diatonic jazz chord sets per scale degree (I–VII in major key)
const MajChords = [
	['', '6', 'M7', 'Maj7', 'M7#11', '9', 'Maj9', 'add9', '69', '13', 'Maj13', 'sus2', 'sus4'],
	['m', 'm6', 'm7', 'm9', 'm11', 'm69', 'mM7', 'm7b5'],
	['m', 'm6', 'm7', 'm9', 'm11', 'm69', 'mM7'],
	['', '6', 'M7', 'Maj7', 'M7#11', 'm', '9', 'Maj9', '69', 'sus4'],
	['', '7', '9', '11', '13', '7sus4', '7b9', '7#9', '7#11', '7b13', '7alt', 'aug', 'aug7'],
	['m', 'm6', 'm7', 'm9', 'm11', 'm69', 'mM7'],
	['dim', 'dim7', 'm7b5', '7', '7b9', 'm', 'm7', 'm9', 'm11', '13'],
];

const DEGREE_OFFSETS = [0, 1, 2, 2.5, 3.5, 4.5, 5.5];
const DEGREE_LABELS = ['I', 'II', 'III', 'IV', 'V', 'VI', 'VII'];

function buildChordName(note, suffix) {
	let chord = note.split('/')[0] + suffix;
	if (chord.indexOf('##') >= 0) {
		chord = transpose(note, 0.5).split('/')[0] + 'dim';
	}
	chord = chord.replace('B#', 'C');
	chord = chord.replace('E#', 'F');
	return chord;
}

function getDegreeChord(root, degreeIndex) {
	const note = transpose(root, DEGREE_OFFSETS[degreeIndex]);
	const suffix = MajChords[degreeIndex][0];
	return buildChordName(note, suffix);
}

function chordButtonHTML(chord) {
	return `<button type="button" class="chord-btn" data-chord="${chord}">${chord}</button>`;
}

function colString(note, group) {
	let st = '<td>';
	for (let i = 0; i < group.length; i++) {
		const chord = buildChordName(note, group[i]);
		st += chordButtonHTML(chord);
	}
	st += '</td>';
	return st;
}

function rowString(note) {
	let st = '<tr><th class="row-key">' + note.split('/')[0] + '</th>';
	st += colString(note, MajChords[0]);
	st += colString(transpose(note, 1), MajChords[1]);
	st += colString(transpose(note, 2), MajChords[2]);
	st += colString(transpose(note, 2.5), MajChords[3]);
	st += colString(transpose(note, 3.5), MajChords[4]);
	st += colString(transpose(note, 4.5), MajChords[5]);
	st += colString(transpose(note, 5.5), MajChords[6]);
	st += '</tr>';
	return st;
}

function buildChordTableHTML() {
	return rowString(getCurrentKey());
}

function updateCurrentKeyLabel() {
	const el = document.getElementById('current-key-label');
	if (el) {
		el.textContent = getCurrentKeyLabel();
	}
}

function attachChordButtonListeners(container) {
	const root = container || document;
	root.querySelectorAll('.chord-btn').forEach((btn) => {
		btn.addEventListener('click', () => {
			ensureAudioStarted();
			playChord(btn.dataset.chord, 1);
			document.querySelectorAll('.chord-btn.active').forEach((b) => b.classList.remove('active'));
			btn.classList.add('active');
		});
	});
}

function formatTransposeValue(val) {
	if (val === 0) return '0';
	return val > 0 ? '+' + val : String(val);
}

function updateTransposeDisplay() {
	const el = document.getElementById('transpose-value');
	if (el) {
		el.textContent = formatTransposeValue(getGlobalTranspose());
	}
	updateCurrentKeyLabel();
}

function changeTranspose(delta) {
	let next = getGlobalTranspose() + delta;
	if (delta > 0 && next > 6.5) next = 6.5;
	if (delta < 0 && next < -6) next = -6;
	setGlobalTranspose(next);
}

function initTransposeUI() {
	const down = document.getElementById('transpose-down');
	const up = document.getElementById('transpose-up');
	if (down) down.addEventListener('click', () => changeTranspose(-0.5));
	if (up) up.addEventListener('click', () => changeTranspose(0.5));
	updateTransposeDisplay();
}

function renderDegreeRow() {
	const container = document.getElementById('degree-chords');
	if (!container) return;
	const root = getCurrentKey();
	let html = '';
	for (let i = 0; i < 7; i++) {
		const chord = getDegreeChord(root, i);
		html += `<button type="button" class="degree-btn chord-btn" data-chord="${chord}">
			<span class="degree-label">${DEGREE_LABELS[i]}</span>
			<span class="degree-chord">${chord}</span>
		</button>`;
	}
	container.innerHTML = html;
	attachChordButtonListeners(container);
}

function renderChordTable() {
	const tbody = document.getElementById('chord-table-body');
	if (!tbody) return;
	tbody.innerHTML = buildChordTableHTML();
	attachChordButtonListeners(tbody);
	updateCurrentKeyLabel();
}

function initChordTable() {
	renderChordTable();
}

function initAppUI() {
	initTransposeUI();
	if (document.getElementById('chord-table-body')) {
		initChordTable();
	}
	if (document.getElementById('degree-chords')) {
		renderDegreeRow();
	}
}

if (document.readyState === 'loading') {
	document.addEventListener('DOMContentLoaded', initAppUI);
} else {
	initAppUI();
}
