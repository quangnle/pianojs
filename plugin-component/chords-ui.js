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
const DEGREE_MAJOR_DOM7_INDICES = new Set([1, 2, 5]);

const LS_SLOT_CUSTOM = 'pianojs-degree-slot-customs-v2';
const LS_SLOT_CUSTOM_LEGACY = 'pianojs-degree-slot-customs-v1';

let pickerDegreeIndex = null;

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

function chordOptionsForDegree(degreeIndex) {
	const root = getCurrentKey();
	const note = transpose(root, DEGREE_OFFSETS[degreeIndex]);
	const suffixes = MajChords[degreeIndex] || [];
	const seen = new Set();
	const options = [];
	for (let i = 0; i < suffixes.length; i++) {
		const chord = buildChordName(note, suffixes[i]);
		if (seen.has(chord)) continue;
		seen.add(chord);
		options.push(chord);
	}
	return options;
}

function appendChordsToDegreeSlot(degreeIndex, chordNames) {
	const rows = readSlotCustomSuffixRows();
	let changed = false;
	for (let i = 0; i < chordNames.length; i++) {
		const suffix = chordSuffixForSlot(chordNames[i], degreeIndex);
		if (suffix == null) continue;
		const list = rows[degreeIndex];
		if (!list.includes(suffix)) {
			list.push(suffix);
			changed = true;
		}
	}
	if (changed) {
		writeSlotCustomSuffixRows(rows);
		renderDegreeRow();
	}
}

function removeChordFromDegreeSlot(degreeIndex, chordName) {
	const { suffix } = parseChordRootAndSuffix(chordName);
	if (!suffix || getDefaultSuffixesForDegree(degreeIndex).has(suffix)) return;
	const rows = readSlotCustomSuffixRows();
	rows[degreeIndex] = rows[degreeIndex].filter((s) => s !== suffix);
	writeSlotCustomSuffixRows(rows);
	renderDegreeRow();
}

function updateCurrentKeyLabel() {
	const el = document.getElementById('current-key-label');
	if (el) el.textContent = getCurrentKeyLabel();
	const jazzKey = document.getElementById('jazzify-key');
	if (jazzKey && typeof getCurrentKey === 'function') {
		jazzKey.value = getCurrentKey();
	}
}

function attachChordPlayListeners(root) {
	const scope = root || document;
	scope.querySelectorAll('.chord-btn').forEach((btn) => {
		if (btn.dataset.chordPlayBound === '1') return;
		btn.dataset.chordPlayBound = '1';
		let lastTouchTs = 0;
		const activate = () => {
			ensureAudioStarted();
			playChord(btn.dataset.chord, 1);
			document.querySelectorAll('.chord-btn.active').forEach((b) => b.classList.remove('active'));
			btn.classList.add('active');
		};
		btn.addEventListener('touchstart', () => { lastTouchTs = Date.now(); activate(); }, { passive: true });
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

function closeChordPicker() {
	const overlay = document.getElementById('chord-picker-overlay');
	if (!overlay) return;
	overlay.hidden = true;
	overlay.setAttribute('aria-hidden', 'true');
	pickerDegreeIndex = null;
}

function openChordPicker(degreeIndex) {
	const overlay = document.getElementById('chord-picker-overlay');
	const listEl = document.getElementById('chord-picker-list');
	const titleEl = document.getElementById('chord-picker-title');
	if (!overlay || !listEl || !titleEl) return;

	pickerDegreeIndex = degreeIndex;
	const root = getCurrentKey();
	const label = DEGREE_LABELS[degreeIndex];
	const customRows = readSlotCustomSuffixRows();
	const defaults = new Set(getDefaultChordNamesForDegree(root, degreeIndex));
	const customs = new Set(customChordNamesForDegree(root, degreeIndex, customRows));
	const options = chordOptionsForDegree(degreeIndex);

	titleEl.textContent = 'Add chords — ' + label + ' (' + root + ')';

	let html = '';
	for (let i = 0; i < options.length; i++) {
		const chord = options[i];
		const safe = escapeHtmlText(chord);
		const isDefault = defaults.has(chord);
		const isCustom = customs.has(chord);
		const checked = isDefault || isCustom;
		const disabled = isDefault;
		const note = isDefault ? ' <span class="picker-tag">default</span>' : isCustom ? ' <span class="picker-tag">added</span>' : '';
		html += `<label class="chord-picker-item${disabled ? ' is-default' : ''}">
			<input type="checkbox" class="chord-picker-check" value="${safe}" ${checked ? 'checked' : ''} ${disabled ? 'disabled' : ''} />
			<span class="chord-picker-name">${safe}${note}</span>
		</label>`;
	}
	listEl.innerHTML = html;

	overlay.hidden = false;
	overlay.setAttribute('aria-hidden', 'false');
}

function bindChordPickerUI() {
	const overlay = document.getElementById('chord-picker-overlay');
	const confirmBtn = document.getElementById('chord-picker-confirm');
	const cancelBtn = document.getElementById('chord-picker-cancel');
	const selectAllBtn = document.getElementById('chord-picker-select-all');
	const clearBtn = document.getElementById('chord-picker-clear');
	if (!overlay) return;

	overlay.addEventListener('click', (e) => {
		if (e.target === overlay) closeChordPicker();
	});

	if (cancelBtn) cancelBtn.addEventListener('click', closeChordPicker);

	if (confirmBtn) {
		confirmBtn.addEventListener('click', () => {
			if (pickerDegreeIndex == null) return;
			const customs = new Set(
				customChordNamesForDegree(getCurrentKey(), pickerDegreeIndex, readSlotCustomSuffixRows()),
			);
			const selected = [];
			overlay.querySelectorAll('.chord-picker-check:not(:disabled)').forEach((cb) => {
				if (cb.checked && cb.value && !customs.has(cb.value)) selected.push(cb.value);
			});
			appendChordsToDegreeSlot(pickerDegreeIndex, selected);
			closeChordPicker();
		});
	}

	if (selectAllBtn) {
		selectAllBtn.addEventListener('click', () => {
			overlay.querySelectorAll('.chord-picker-check:not(:disabled)').forEach((cb) => {
				cb.checked = true;
			});
		});
	}

	if (clearBtn) {
		clearBtn.addEventListener('click', () => {
			overlay.querySelectorAll('.chord-picker-check:not(:disabled)').forEach((cb) => {
				cb.checked = false;
			});
		});
	}
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
			? `<button type="button" class="slot-remove" data-degree="${i}" data-chord="${safe}" aria-label="Remove ${safe}">×</button>`
			: '';
		chips += `<div class="degree-slot-row">
			<button type="button" class="degree-slot-btn chord-btn" data-chord="${safe}" draggable="true">${ch}</button>${removeBtn}
		</div>`;
	}
	return `<div class="degree-cell" data-degree="${i}">
		<span class="degree-label">${label}</span>
		<div class="degree-slot-list">${chips}</div>
		<button type="button" class="degree-add-btn" data-degree="${i}" aria-label="Add chords to ${label}">+ Add</button>
	</div>`;
}

function bindDegreeSlotUI(container) {
	container.querySelectorAll('.degree-add-btn').forEach((btn) => {
		btn.addEventListener('click', () => {
			const deg = parseInt(btn.dataset.degree, 10);
			if (!Number.isNaN(deg)) openChordPicker(deg);
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
}

function formatTransposeValue(val) {
	if (val === 0) return '0';
	return val > 0 ? '+' + val : String(val);
}

function updateTransposeDisplay() {
	const el = document.getElementById('transpose-value');
	if (el) el.textContent = formatTransposeValue(getGlobalTranspose());
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

function initAppUI() {
	initTransposeUI();
	bindChordPickerUI();
	if (document.getElementById('degree-chords')) renderDegreeRow();
}

if (document.readyState === 'loading') {
	document.addEventListener('DOMContentLoaded', initAppUI);
} else {
	initAppUI();
}
