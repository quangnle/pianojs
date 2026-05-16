/**
 * Pure DOM piano (no p5). Same behaviour as legacy PianoUI for definitions.js / chords-ui.
 */
(function () {
	const DEFAULT_O = 3;
	const DEFAULT_N_OCT = 3;

	function noteLabel(name, octave) {
		return name.split('/')[0] + octave;
	}

	function buildKeySpecs(o, nOctave) {
		const W = nOctave * 7 + 1;
		const stepWidthPct = 100 / W;
		const keys = [];
		let step = 0;
		for (let i = 0; i < nOctave * 12 + 1; i++) {
			const name = NOTES[i % 12];
			const octave = Math.ceil((i + 1) / 12) + o;
			if (name.length === 1) {
				keys.push({
					name,
					octave,
					type: 'white',
					label: noteLabel(name, octave),
					leftPct: step * stepWidthPct,
					widthPct: stepWidthPct,
				});
				step++;
			} else {
				keys.push({
					name,
					octave,
					type: 'black',
					label: noteLabel(name, octave),
					leftPct: (step - 0.25) * stepWidthPct,
					widthPct: stepWidthPct / 2,
				});
			}
		}
		return keys;
	}

	function updateTransposeBadge(el) {
		if (!el) return;
		const t = typeof getGlobalTranspose === 'function' ? getGlobalTranspose() : 0;
		const fmt = typeof formatTransposeValue === 'function' ? formatTransposeValue(t) : String(t);
		el.textContent = '♯/♭ ' + fmt;
	}

	function mountPiano(holder, o, nOctave) {
		const specs = buildKeySpecs(o, nOctave);
		const root = document.createElement('div');
		root.className = 'piano-root';
		root.innerHTML =
			'<div class="piano-transpose-bar"><span class="piano-transpose-badge" id="piano-transpose-badge"></span></div>' +
			'<div class="piano-keys-stage">' +
			'<div class="piano-whites" id="piano-whites"></div>' +
			'<div class="piano-blacks" id="piano-blacks"></div>' +
			'</div>';

		const whitesEl = root.querySelector('#piano-whites');
		const blacksEl = root.querySelector('#piano-blacks');
		const badge = root.querySelector('#piano-transpose-badge');
		const keyEls = new Map();

		for (let i = 0; i < specs.length; i++) {
			const s = specs[i];
			const btn = document.createElement('button');
			btn.type = 'button';
			btn.className = 'piano-key piano-key--' + s.type;
			btn.dataset.note = s.label;
			btn.setAttribute('aria-label', s.label);
			btn.setAttribute('data-key-index', String(i));

			if (s.type === 'white') {
				btn.style.flex = '1 1 0';
				btn.style.minWidth = '0';
				whitesEl.appendChild(btn);
			} else {
				btn.style.left = s.leftPct + '%';
				btn.style.width = s.widthPct + '%';
				blacksEl.appendChild(btn);
			}
			keyEls.set(s.label, btn);
		}

		let activeLabel = null;
		let captureBtn = null;

		function setPressed(label, on) {
			const el = keyEls.get(label);
			if (el) el.classList.toggle('is-pressed', on);
		}

		function playForLabel(label) {
			if (typeof playSound === 'function') playSound(label, 1);
		}

		function onPointerDown(ev) {
			const btn = ev.target.closest('.piano-key');
			if (!btn || !root.contains(btn)) return;
			ev.preventDefault();
			const label = btn.dataset.note;
			if (!label) return;
			activeLabel = label;
			captureBtn = btn;
			for (const p of keyEls.values()) p.classList.remove('is-pressed');
			setPressed(label, true);
			if (typeof clearChordHighlightOnPiano === 'function') clearChordHighlightOnPiano();
			playForLabel(label);
			try {
				btn.setPointerCapture(ev.pointerId);
			} catch (_) {}
		}

		function onPointerUpLeave(ev) {
			if (captureBtn && ev && ev.pointerId != null) {
				try {
					if (captureBtn.hasPointerCapture(ev.pointerId)) {
						captureBtn.releasePointerCapture(ev.pointerId);
					}
				} catch (_) {}
			}
			captureBtn = null;
			if (activeLabel) {
				setPressed(activeLabel, false);
				activeLabel = null;
			}
		}

		root.addEventListener('pointerdown', onPointerDown);
		root.addEventListener('pointerup', onPointerUpLeave);
		root.addEventListener('pointercancel', onPointerUpLeave);
		window.addEventListener('pointerup', onPointerUpLeave);
		window.addEventListener('pointercancel', onPointerUpLeave);

		holder._pianoTeardown = function () {
			root.removeEventListener('pointerdown', onPointerDown);
			root.removeEventListener('pointerup', onPointerUpLeave);
			root.removeEventListener('pointercancel', onPointerUpLeave);
			window.removeEventListener('pointerup', onPointerUpLeave);
			window.removeEventListener('pointercancel', onPointerUpLeave);
		};

		const api = {
			refreshTransposeBadge: function () {
				updateTransposeBadge(badge);
			},
			setHighlightedNotes: function (noteKeys) {
				const names = Array.isArray(noteKeys) ? noteKeys : [noteKeys];
				const set = new Set(names);
				for (const [label, el] of keyEls) {
					el.classList.toggle('is-highlighted', set.has(label));
				}
			},
			clearHighlights: function () {
				for (const el of keyEls.values()) el.classList.remove('is-highlighted');
			},
		};

		Object.defineProperty(api, 'currentTranspose', {
			get: function () {
				return typeof getGlobalTranspose === 'function' ? getGlobalTranspose() : 0;
			},
			set: function () {
				api.refreshTransposeBadge();
			},
		});

		holder.appendChild(root);
		api.refreshTransposeBadge();
		return api;
	}

	function init() {
		const holder = document.getElementById('sketch-holder');
		if (!holder || typeof NOTES === 'undefined') return;

		if (holder._pianoTeardown) {
			holder._pianoTeardown();
			holder._pianoTeardown = null;
		}
		holder.innerHTML = '';

		const o = DEFAULT_O;
		const nOctave = DEFAULT_N_OCT;
		window.pianoui = mountPiano(holder, o, nOctave);
		if (window.pianoui) {
			window.pianoui.currentTranspose = getGlobalTranspose();
		}
	}

	if (document.readyState === 'loading') {
		document.addEventListener('DOMContentLoaded', init);
	} else {
		init();
	}
})();
