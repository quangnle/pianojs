/** Jazzify tab: drag progression, suggest reharmonizations. */

const LS_JAZZIFY_TAB = 'pianojs-active-tab-v1';
const LS_JAZZIFY_PROGRESSION = 'pianojs-jazzify-progression-v1';

let songProgression = [];

function escapeHtmlText(s) {
	const d = document.createElement('div');
	d.textContent = s;
	return d.innerHTML;
}

function loadSongProgression() {
	try {
		const raw = localStorage.getItem(LS_JAZZIFY_PROGRESSION);
		if (!raw) return;
		const arr = JSON.parse(raw);
		if (Array.isArray(arr)) songProgression = arr.filter((c) => typeof c === 'string' && c.trim());
	} catch (_) {}
}

function saveSongProgression() {
	try {
		localStorage.setItem(LS_JAZZIFY_PROGRESSION, JSON.stringify(songProgression));
	} catch (_) {}
}

function appendChordToProgression(chordName) {
	const ch = (chordName || '').trim();
	if (!ch) return;
	songProgression.push(ch);
	saveSongProgression();
	renderProgressionStrip();
}

function removeProgressionChord(index) {
	songProgression.splice(index, 1);
	saveSongProgression();
	renderProgressionStrip();
}

function clearProgression() {
	songProgression = [];
	saveSongProgression();
	renderProgressionStrip();
	const out = document.getElementById('jazzify-suggestions');
	if (out) out.innerHTML = '';
}

function renderProgressionStrip() {
	const strip = document.getElementById('song-progression');
	if (!strip) return;

	if (!songProgression.length) {
		strip.innerHTML =
			'<p class="progression-empty">No chords yet — drag from the library below or type a chord and press Add.</p>';
		return;
	}

	const parts = [];
	for (let i = 0; i < songProgression.length; i++) {
		const ch = songProgression[i];
		const safe = String(ch).replace(/"/g, '&quot;');
		parts.push(
			'<div class="progression-slot">' +
				'<span class="progression-slot-index">' +
				(i + 1) +
				'</span>' +
				'<button type="button" class="progression-chip chord-btn" data-chord="' +
				safe +
				'">' +
				escapeHtmlText(ch) +
				'</button>' +
				'<button type="button" class="progression-remove" data-index="' +
				i +
				'" aria-label="Remove ' +
				safe +
				'">×</button>' +
				'</div>',
		);
	}
	strip.innerHTML = parts.join('');

	strip.querySelectorAll('.progression-remove').forEach((btn) => {
		btn.addEventListener('click', (e) => {
			e.stopPropagation();
			const idx = parseInt(btn.dataset.index, 10);
			if (!Number.isNaN(idx)) removeProgressionChord(idx);
		});
	});

	if (typeof attachChordPlayListeners === 'function') {
		attachChordPlayListeners(strip);
	}
}

function renderSuggestions(variants) {
	const out = document.getElementById('jazzify-suggestions');
	if (!out) return;

	if (!variants.length) {
		out.innerHTML = '<p class="jazzify-hint muted">Add at least one chord, then click Jazzify.</p>';
		return;
	}

	const blocks = [];
	for (let v = 0; v < variants.length; v++) {
		const variant = variants[v];
		const steps = variant.steps || variant.chords.map((c) => ({ chord: c, kind: 'anchor' }));
		const insertCount = steps.filter((s) => s.kind === 'insert').length;
		const meta =
			insertCount > 0
				? ' <span class="jazzify-variant-meta">(' +
					steps.length +
					' chords, +' +
					insertCount +
					' inserted)</span>'
				: '';
		const chips = [];
		for (let i = 0; i < steps.length; i++) {
			const step = steps[i];
			const ch = step.chord;
			const safe = String(ch).replace(/"/g, '&quot;');
			const insertClass = step.kind === 'insert' ? ' suggestion-chip--insert' : '';
			chips.push(
				'<button type="button" class="suggestion-chip chord-btn' +
					insertClass +
					'" data-chord="' +
					safe +
					'" title="' +
					(step.kind === 'insert' ? 'Inserted: ' : 'Song: ') +
					escapeHtmlText(ch) +
					'">' +
					escapeHtmlText(ch) +
					'</button>',
			);
			if (i < steps.length - 1) {
				chips.push('<span class="suggestion-arrow" aria-hidden="true">→</span>');
			}
		}
		blocks.push(
			'<article class="jazzify-variant" data-variant="' +
				variant.id +
				'">' +
				'<header class="jazzify-variant-head">' +
				'<h3>' +
				escapeHtmlText(variant.label) +
				meta +
				'</h3>' +
				'<p class="jazzify-variant-desc">' +
				escapeHtmlText(variant.description) +
				'</p>' +
				'</header>' +
				'<div class="suggestion-row">' +
				chips.join('') +
				'</div>' +
				'</article>',
		);
	}
	out.innerHTML = blocks.join('');

	if (typeof attachChordPlayListeners === 'function') {
		attachChordPlayListeners(out);
	}
}

function runJazzify() {
	const keyEl = document.getElementById('jazzify-key');
	const keyRoot =
		keyEl && keyEl.value ? keyEl.value : typeof getCurrentKey === 'function' ? getCurrentKey() : 'C';

	if (!songProgression.length) {
		renderSuggestions([]);
		return;
	}

	if (typeof jazzifyProgression !== 'function') {
		return;
	}

	const variants = jazzifyProgression(songProgression, keyRoot);
	renderSuggestions(variants);
}

function bindProgressionDropZone() {
	const zone = document.getElementById('progression-drop-zone');
	if (!zone) return;

	zone.addEventListener('dragover', (e) => {
		e.preventDefault();
		try {
			e.dataTransfer.dropEffect = 'copy';
		} catch (_) {}
		zone.classList.add('is-drag-hover');
	});
	zone.addEventListener('dragleave', () => zone.classList.remove('is-drag-hover'));
	zone.addEventListener('drop', (e) => {
		e.preventDefault();
		zone.classList.remove('is-drag-hover');
		let chord = '';
		try {
			chord = e.dataTransfer.getData('text/plain');
		} catch (_) {}
		if (chord) appendChordToProgression(chord.trim());
	});
}

function bindManualChordAdd() {
	const input = document.getElementById('jazzify-chord-input');
	const btn = document.getElementById('jazzify-chord-add');
	if (!input || !btn) return;

	const add = () => {
		appendChordToProgression(input.value);
		input.value = '';
		input.focus();
	};

	btn.addEventListener('click', add);
	input.addEventListener('keydown', (e) => {
		if (e.key === 'Enter') {
			e.preventDefault();
			add();
		}
	});
}

function populateKeySelect() {
	const sel = document.getElementById('jazzify-key');
	if (!sel || typeof NOTES === 'undefined') return;

	const current = typeof getCurrentKey === 'function' ? getCurrentKey() : 'C';
	if (sel.options.length) {
		sel.value = current;
		return;
	}

	for (let i = 0; i < 12; i++) {
		const name = NOTES[i].split('/')[0];
		const opt = document.createElement('option');
		opt.value = name;
		opt.textContent = name + ' major';
		sel.appendChild(opt);
	}
	sel.value = current;
}

function initJazzifyOnTranspose() {
	const sel = document.getElementById('jazzify-key');
	if (sel && typeof getCurrentKey === 'function') {
		sel.value = getCurrentKey();
	}
}

function initAppTabs() {
	const tabBtns = document.querySelectorAll('.app-tab');
	const panels = document.querySelectorAll('.tab-panel');
	if (!tabBtns.length) return;

	const show = (id) => {
		tabBtns.forEach((b) => {
			const on = b.dataset.tab === id;
			b.classList.toggle('is-active', on);
			b.setAttribute('aria-selected', on ? 'true' : 'false');
		});
		panels.forEach((p) => {
			const on = p.id === 'tab-panel-' + id;
			p.classList.toggle('is-hidden', !on);
			p.hidden = !on;
		});
		try {
			localStorage.setItem(LS_JAZZIFY_TAB, id);
		} catch (_) {}
	};

	let initial = 'practice';
	try {
		const saved = localStorage.getItem(LS_JAZZIFY_TAB);
		if (saved === 'practice' || saved === 'jazzify') initial = saved;
	} catch (_) {}
	show(initial);

	tabBtns.forEach((btn) => {
		btn.addEventListener('click', () => show(btn.dataset.tab));
	});
}

function bindGlobalChordDragSources() {
	document.addEventListener('dragstart', (e) => {
		const btn = e.target.closest('.chord-lib-btn, .degree-slot-btn, .progression-chip');
		if (!btn || !btn.dataset.chord) return;
		try {
			e.dataTransfer.setData('text/plain', btn.dataset.chord);
			e.dataTransfer.effectAllowed = 'copy';
		} catch (_) {}
		document.body.classList.add('chord-drag-active');
	});
	document.addEventListener('dragend', () => {
		document.body.classList.remove('chord-drag-active');
	});
}

function initJazzifyUI() {
	loadSongProgression();
	populateKeySelect();
	renderProgressionStrip();
	bindProgressionDropZone();
	bindManualChordAdd();
	bindGlobalChordDragSources();

	const runBtn = document.getElementById('jazzify-run');
	const clearBtn = document.getElementById('jazzify-clear');
	if (runBtn) runBtn.addEventListener('click', runJazzify);
	if (clearBtn) clearBtn.addEventListener('click', clearProgression);

	['transpose-down', 'transpose-up'].forEach((id) => {
		const el = document.getElementById(id);
		if (el) el.addEventListener('click', () => setTimeout(initJazzifyOnTranspose, 0));
	});
}

function initJazzifyApp() {
	initAppTabs();
	initJazzifyUI();
}

if (document.readyState === 'loading') {
	document.addEventListener('DOMContentLoaded', initJazzifyApp);
} else {
	initJazzifyApp();
}
