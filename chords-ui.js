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
/** Scale degrees (0-based) that show diatonic minor + parallel major + dom7 (e.g. in C: Dm, D, D7). */
const DEGREE_MAJOR_DOM7_INDICES = new Set([1, 2, 5]);

const LS_SLOT_CUSTOM = 'pianojs-degree-slot-customs-v2';
const LS_SLOT_CUSTOM_LEGACY = 'pianojs-degree-slot-customs-v1';
const LS_JAZZ_COLLAPSED = 'pianojs-jazz-panel-collapsed';

let pickedLibChord = null;

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

function getDefaultChordNamesForDegree(root, i) {
	if (DEGREE_MAJOR_DOM7_INDICES.has(i)) {
		const note = transpose(root, DEGREE_OFFSETS[i]);
		const diatonicSuffix = MajChords[i][0];
		return [
			buildChordName(note, diatonicSuffix),
			buildChordName(note, ''),
			buildChordName(note, '7'),
		];
	}
	return [getDegreeChord(root, i)];
}

function emptySevenRows() {
	return [[], [], [], [], [], [], []];
}

/** Split chord label into root note and type suffix (e.g. D9 → D, 9). */
function parseChordRootAndSuffix(chordName) {
	let root = chordName[0];
	let suffix = chordName.slice(1);
	if (chordName[1] === '#' || chordName[1] === 'b') {
		root += chordName[1];
		suffix = chordName.slice(2);
	}
	return { root, suffix: suffix.replace(/\s/g, '') };
}

function getDefaultSuffixesForDegree(degreeIndex) {
	if (DEGREE_MAJOR_DOM7_INDICES.has(degreeIndex)) {
		return new Set([MajChords[degreeIndex][0], '', '7']);
	}
	return new Set([MajChords[degreeIndex][0]]);
}

function migrateLegacySlotStorage(legacyAll) {
	const merged = emptySevenRows();
	if (!legacyAll || typeof legacyAll !== 'object') return merged;
	for (const transposeKey of Object.keys(legacyAll)) {
		const rows = legacyAll[transposeKey];
		if (!Array.isArray(rows) || rows.length !== 7) continue;
		const t = parseFloat(transposeKey);
		if (Number.isNaN(t)) continue;
		for (let i = 0; i < 7; i++) {
			const list = rows[i];
			if (!Array.isArray(list)) continue;
			const defaultSuffixes = getDefaultSuffixesForDegree(i);
			for (let j = 0; j < list.length; j++) {
				const chord = list[j];
				if (typeof chord !== 'string' || !chord.length) continue;
				const { suffix } = parseChordRootAndSuffix(chord);
				if (!suffix || defaultSuffixes.has(suffix)) continue;
				if (!merged[i].includes(suffix)) merged[i].push(suffix);
			}
		}
	}
	return merged;
}

/** Custom chord types per degree (suffix only); follows transpose via degree root. */
function readSlotCustomSuffixRows() {
	try {
		let raw = localStorage.getItem(LS_SLOT_CUSTOM);
		let parsed = raw ? JSON.parse(raw) : null;
		if (!parsed || !Array.isArray(parsed.suffixes) || parsed.suffixes.length !== 7) {
			const legacyRaw = localStorage.getItem(LS_SLOT_CUSTOM_LEGACY);
			const legacyAll = legacyRaw ? JSON.parse(legacyRaw) : null;
			parsed = { suffixes: migrateLegacySlotStorage(legacyAll) };
			localStorage.setItem(LS_SLOT_CUSTOM, JSON.stringify(parsed));
		}
		return parsed.suffixes.map((r) => (Array.isArray(r) ? r.filter((s) => typeof s === 'string' && s.length) : []));
	} catch {
		return emptySevenRows();
	}
}

function writeSlotCustomSuffixRows(rows) {
	try {
		localStorage.setItem(LS_SLOT_CUSTOM, JSON.stringify({ suffixes: rows.map((r) => r.slice()) }));
	} catch (_) {}
}

function customChordNamesForDegree(root, degreeIndex, suffixRows) {
	const note = transpose(root, DEGREE_OFFSETS[degreeIndex]);
	const list = suffixRows[degreeIndex] || [];
	const defaultSuffixes = getDefaultSuffixesForDegree(degreeIndex);
	const out = [];
	for (let i = 0; i < list.length; i++) {
		const suffix = list[i];
		if (defaultSuffixes.has(suffix)) continue;
		out.push(buildChordName(note, suffix));
	}
	return out;
}

function mergedChordNamesForDegree(root, i, suffixRows) {
	const defaults = getDefaultChordNamesForDegree(root, i);
	const customs = customChordNamesForDegree(root, i, suffixRows);
	const seen = new Set();
	const out = [];
	for (const c of defaults) {
		if (!seen.has(c)) {
			seen.add(c);
			out.push(c);
		}
	}
	for (const c of customs) {
		if (!seen.has(c)) {
			seen.add(c);
			out.push(c);
		}
	}
	return out;
}

function isCustomSlotChord(i, chord, suffixRows) {
	return customChordNamesForDegree(getCurrentKey(), i, suffixRows).includes(chord);
}

function chordSuffixForSlot(chordName, degreeIndex) {
	const { suffix } = parseChordRootAndSuffix(chordName);
	if (getDefaultSuffixesForDegree(degreeIndex).has(suffix)) return null;
	return suffix;
}

function escapeHtmlText(s) {
	return String(s)
		.replace(/&/g, '&amp;')
		.replace(/</g, '&lt;')
		.replace(/>/g, '&gt;')
		.replace(/"/g, '&quot;');
}

function chordButtonHTML(chord) {
	const safe = String(chord).replace(/"/g, '&quot;');
	return `<button type="button" class="chord-btn chord-lib-btn" draggable="true" data-chord="${safe}">${chord}</button>`;
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
	const jazzKey = document.getElementById('jazzify-key');
	if (jazzKey && typeof getCurrentKey === 'function') {
		jazzKey.value = getCurrentKey();
	}
}

function setPickedLibChord(name) {
	pickedLibChord = name || null;
	document.querySelectorAll('.chord-lib-btn.lib-picked').forEach((b) => b.classList.remove('lib-picked'));
	if (pickedLibChord) {
		document.querySelectorAll('.chord-lib-btn').forEach((b) => {
			if (b.dataset.chord === pickedLibChord) b.classList.add('lib-picked');
		});
	}
	document.querySelectorAll('.degree-drop-target').forEach((el) => {
		el.classList.toggle('drop-target-active', !!pickedLibChord);
	});
}

function attachChordPlayListeners(root) {
	const scope = root || document;
	scope.querySelectorAll('.chord-btn').forEach((btn) => {
		if (btn.dataset.chordPlayBound === '1') return;
		btn.dataset.chordPlayBound = '1';
		let lastTouchTs = 0;
		const activate = () => {
			ensureAudioStarted();
			void preloadSamples();
			playChord(btn.dataset.chord, 1);
			document.querySelectorAll('.chord-btn.active').forEach((b) => b.classList.remove('active'));
			btn.classList.add('active');
		};
		btn.addEventListener(
			'touchstart',
			() => {
				lastTouchTs = Date.now();
				activate();
			},
			{ passive: true },
		);
		btn.addEventListener('click', () => {
			if (Date.now() - lastTouchTs < 450) return;
			activate();
		});
		btn.addEventListener('keydown', (e) => {
			if (e.repeat) return;
			if (e.key === 'Enter' || e.key === ' ') {
				e.preventDefault();
				activate();
			}
		});
	});
}

function attachLibraryChordExtras(tbody) {
	if (!tbody) return;
	tbody.querySelectorAll('.chord-lib-btn').forEach((btn) => {
		btn.addEventListener('dragstart', (e) => {
			const chord = btn.dataset.chord || '';
			try {
				e.dataTransfer.setData('text/plain', chord);
				e.dataTransfer.effectAllowed = 'copy';
			} catch (_) {}
			document.body.classList.add('chord-drag-active');
			setPickedLibChord(chord);
		});
		btn.addEventListener('dragend', () => {
			document.body.classList.remove('chord-drag-active');
		});
		const markPicked = () => setPickedLibChord(btn.dataset.chord);
		btn.addEventListener('touchend', markPicked, { passive: true });
		btn.addEventListener('click', markPicked);
	});
}

function appendChordToDegreeSlot(degreeIndex, chordName) {
	const suffix = chordSuffixForSlot(chordName, degreeIndex);
	if (suffix == null) return;
	const rows = readSlotCustomSuffixRows();
	const list = rows[degreeIndex];
	if (list.includes(suffix)) return;
	list.push(suffix);
	rows[degreeIndex] = list;
	writeSlotCustomSuffixRows(rows);
	setPickedLibChord(null);
	renderDegreeRow();
}

function removeChordFromDegreeSlot(degreeIndex, chordName) {
	const { suffix } = parseChordRootAndSuffix(chordName);
	if (!suffix || getDefaultSuffixesForDegree(degreeIndex).has(suffix)) return;
	const rows = readSlotCustomSuffixRows();
	rows[degreeIndex] = rows[degreeIndex].filter((s) => s !== suffix);
	writeSlotCustomSuffixRows(rows);
	renderDegreeRow();
}

function degreeCellHTML(root, i, customRows) {
	const label = DEGREE_LABELS[i];
	const chords = mergedChordNamesForDegree(root, i, customRows);
	let chips = '';
	for (let j = 0; j < chords.length; j++) {
		const ch = chords[j];
		const safe = String(ch).replace(/"/g, '&quot;');
		const isCust = isCustomSlotChord(i, ch, customRows);
		const removeBtn = isCust
			? `<button type="button" class="slot-remove" data-degree="${i}" data-chord="${safe}" aria-label="Remove ${safe} from slot">×</button>`
			: '';
		chips += `<div class="degree-slot-row">
			<button type="button" class="degree-slot-btn chord-btn" data-chord="${safe}" draggable="true">${ch}</button>${removeBtn}
		</div>`;
	}
	const pickHint = pickedLibChord
		? `<span class="drop-target-hint">Add “${escapeHtmlText(pickedLibChord)}”</span>`
		: '<span class="drop-target-hint muted">Tap a library chord, then +</span>';
	return `<div class="degree-cell" data-degree="${i}">
		<span class="degree-label">${label}</span>
		<div class="degree-slot-list">${chips}</div>
		<div class="degree-drop-target" data-degree="${i}" role="button" tabindex="0" aria-label="Add chord to ${label}">
			<span class="drop-target-plus">+</span> Add
			${pickHint}
		</div>
	</div>`;
}

function bindDegreeSlotUI(container) {
	container.querySelectorAll('.degree-drop-target').forEach((zone) => {
		const deg = parseInt(zone.dataset.degree, 10);
		if (Number.isNaN(deg)) return;
		zone.addEventListener('click', (e) => {
			if (e.target.closest('.slot-remove')) return;
			if (pickedLibChord) appendChordToDegreeSlot(deg, pickedLibChord);
		});
		zone.addEventListener('keydown', (e) => {
			if (e.key === 'Enter' || e.key === ' ') {
				e.preventDefault();
				if (pickedLibChord) appendChordToDegreeSlot(deg, pickedLibChord);
			}
		});
		zone.addEventListener('dragover', (e) => {
			e.preventDefault();
			try {
				e.dataTransfer.dropEffect = 'copy';
			} catch (_) {}
			zone.classList.add('degree-drop-hover');
		});
		zone.addEventListener('dragleave', () => zone.classList.remove('degree-drop-hover'));
		zone.addEventListener('drop', (e) => {
			e.preventDefault();
			zone.classList.remove('degree-drop-hover');
			let chord = '';
			try {
				chord = e.dataTransfer.getData('text/plain');
			} catch (_) {}
			if (chord) appendChordToDegreeSlot(deg, chord.trim());
		});
	});
	container.querySelectorAll('.slot-remove').forEach((btn) => {
		btn.addEventListener('click', (e) => {
			e.preventDefault();
			e.stopPropagation();
			const d = parseInt(btn.dataset.degree, 10);
			const ch = btn.dataset.chord;
			if (!Number.isNaN(d) && ch) removeChordFromDegreeSlot(d, ch);
		});
	});
}

function renderDegreeRow() {
	const container = document.getElementById('degree-chords');
	if (!container) return;
	const root = getCurrentKey();
	const customRows = readSlotCustomSuffixRows();
	let html = '';
	for (let i = 0; i < 7; i++) {
		html += degreeCellHTML(root, i, customRows);
	}
	container.innerHTML = html;
	attachChordPlayListeners(container);
	bindDegreeSlotUI(container);
	setPickedLibChord(pickedLibChord);
}

function renderChordTable() {
	const tbody = document.getElementById('chord-table-body');
	if (!tbody) return;
	tbody.innerHTML = buildChordTableHTML();
	attachChordPlayListeners(tbody);
	attachLibraryChordExtras(tbody);
	updateCurrentKeyLabel();
}

function initChordTable() {
	renderChordTable();
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

function initJazzAccordion() {
	const section = document.getElementById('jazz-chords-section');
	const btn = document.getElementById('jazz-chords-toggle');
	const panel = document.getElementById('jazz-chords-panel');
	if (!section || !btn || !panel) return;

	const applyCollapsed = (collapsed) => {
		section.classList.toggle('is-collapsed', collapsed);
		btn.setAttribute('aria-expanded', collapsed ? 'false' : 'true');
		try {
			localStorage.setItem(LS_JAZZ_COLLAPSED, collapsed ? '1' : '0');
		} catch (_) {}
	};

	let collapsed = false;
	try {
		collapsed = localStorage.getItem(LS_JAZZ_COLLAPSED) === '1';
	} catch (_) {}
	applyCollapsed(collapsed);

	btn.addEventListener('click', () => applyCollapsed(!section.classList.contains('is-collapsed')));
}

function initAppUI() {
	initTransposeUI();
	initJazzAccordion();
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
