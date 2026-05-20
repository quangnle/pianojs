/** Block + arpeggio playback. Requires definitions.js, chord-voicing.js, arpeggio-patterns.js */

const LS_ACCOMPANIMENT = 'pianojs-accompaniment-v1';

let accompanimentMode = 'block';
let arpeggioStyle = 'ballad';
let bpm = 72;
let activeChordName = null;
let loopGeneration = 0;
let highlightTimeouts = [];
let arpeggioPart = null;

function loadAccompanimentSettings() {
	try {
		const raw = localStorage.getItem(LS_ACCOMPANIMENT);
		if (!raw) return;
		const s = JSON.parse(raw);
		if (s.mode === 'block' || s.mode === 'arpeggio') accompanimentMode = s.mode;
		if (s.style === 'ballad' || s.style === 'waltz') arpeggioStyle = s.style;
		if (typeof s.bpm === 'number' && s.bpm >= 50 && s.bpm <= 200) bpm = s.bpm;
	} catch (_) {}
}

function saveAccompanimentSettings() {
	try {
		localStorage.setItem(
			LS_ACCOMPANIMENT,
			JSON.stringify({ mode: accompanimentMode, style: arpeggioStyle, bpm }),
		);
	} catch (_) {}
}

function getAccompanimentMode() {
	return accompanimentMode;
}

function getArpeggioStyle() {
	return arpeggioStyle;
}

function getAccompanimentBpm() {
	return bpm;
}

function setAccompanimentMode(mode) {
	if (mode !== 'block' && mode !== 'arpeggio') return;
	accompanimentMode = mode;
	saveAccompanimentSettings();
	if (mode === 'block') stopPlayback();
	updateAccompanimentUI();
}

function setArpeggioStyle(style) {
	if (style !== 'ballad' && style !== 'waltz') return;
	arpeggioStyle = style;
	saveAccompanimentSettings();
	if (accompanimentMode === 'arpeggio' && activeChordName) {
		startArpeggioLoop(activeChordName);
	}
	updateAccompanimentUI();
}

function setAccompanimentBpm(next) {
	bpm = Math.max(50, Math.min(200, next));
	saveAccompanimentSettings();
	if (typeof Tone !== 'undefined') Tone.Transport.bpm.value = bpm;
	if (accompanimentMode === 'arpeggio' && activeChordName) {
		startArpeggioLoop(activeChordName);
	}
	updateAccompanimentUI();
}

function clearHighlightTimeouts() {
	for (let i = 0; i < highlightTimeouts.length; i++) {
		clearTimeout(highlightTimeouts[i]);
	}
	highlightTimeouts = [];
}

function scheduleHighlight(pitch, audioTime, durationSec, gen) {
	if (typeof Tone !== 'undefined' && Tone.Draw) {
		Tone.Draw.schedule(() => {
			if (gen !== loopGeneration) return;
			if (typeof window !== 'undefined' && window.pianoui) {
				window.pianoui.setHighlightedNotes([pitch]);
			}
		}, audioTime);
		Tone.Draw.schedule(() => {
			if (gen !== loopGeneration) return;
			if (typeof window !== 'undefined' && window.pianoui) {
				window.pianoui.clearHighlights();
			}
		}, audioTime + durationSec);
		return;
	}
	const delayMs = Math.max(0, (audioTime - Tone.now()) * 1000);
	const durMs = Math.max(50, durationSec * 1000);
	const onId = setTimeout(() => {
		if (gen !== loopGeneration) return;
		if (typeof window !== 'undefined' && window.pianoui) window.pianoui.setHighlightedNotes([pitch]);
	}, delayMs);
	const offId = setTimeout(() => {
		if (gen !== loopGeneration) return;
		if (typeof window !== 'undefined' && window.pianoui) window.pianoui.clearHighlights();
	}, delayMs + durMs);
	highlightTimeouts.push(onId, offId);
}

function stopPlayback() {
	loopGeneration++;
	activeChordName = null;
	clearHighlightTimeouts();
	if (typeof clearChordHighlightOnPiano === 'function') clearChordHighlightOnPiano();
	if (typeof Tone !== 'undefined') {
		Tone.Transport.stop();
		Tone.Transport.cancel(0);
		if (arpeggioPart) {
			arpeggioPart.stop(0);
			arpeggioPart.dispose();
			arpeggioPart = null;
		}
	}
}

function playBlockChord(chordName, duration) {
	const keys = getKeysFromChord(chordName);
	if (typeof highlightChordOnPiano === 'function') highlightChordOnPiano(keys);
	playSamplerNotes(keys, duration);
}

function startArpeggioLoop(chordName) {
	stopPlayback();
	activeChordName = chordName;
	const gen = ++loopGeneration;
	const voicing = getSpreadChordVoicing(chordName);
	const events = buildPatternEvents(voicing, arpeggioStyle, bpm);
	const loopDur = getPatternLoopDurationSec(arpeggioStyle, bpm);

	ensureAudioStarted();
	preloadSamples().then(() => {
		if (gen !== loopGeneration) return;
		Tone.Transport.bpm.value = bpm;
		Tone.Transport.timeSignature = arpeggioStyle === 'waltz' ? [3, 4] : [4, 4];

		const noteEvents = events.map((ev) => ({
			time: ev.timeSec,
			note: ev.pitch,
			duration: ev.durationSec,
			velocity: ev.velocity,
		}));

		arpeggioPart = new Tone.Part((time, value) => {
			if (gen !== loopGeneration) return;
			Sampler.triggerAttackRelease(value.note, value.duration, time, value.velocity);
			scheduleHighlight(value.note, time, value.duration, gen);
		}, noteEvents);

		arpeggioPart.loop = true;
		arpeggioPart.loopEnd = loopDur;
		arpeggioPart.start(0);
		Tone.Transport.start();
	});
}

function playChordPlayback(chordName, duration) {
	ensureAudioStarted();
	void preloadSamples();
	if (accompanimentMode === 'arpeggio') {
		startArpeggioLoop(chordName);
		return;
	}
	playBlockChord(chordName, duration);
}

function playSoundPlayback(keys, duration) {
	stopPlayback();
	ensureAudioStarted();
	if (typeof clearChordHighlightOnPiano === 'function') clearChordHighlightOnPiano();
	const list = Array.isArray(keys) ? keys : [keys];
	const transposed = list.map(applyTransposeToNote);
	playSamplerNotes(transposed, duration);
}

function initAccompanimentUI() {
	loadAccompanimentSettings();
	const modeBlock = document.getElementById('accomp-mode-block');
	const modeArp = document.getElementById('accomp-mode-arpeggio');
	const styleBallad = document.getElementById('accomp-style-ballad');
	const styleWaltz = document.getElementById('accomp-style-waltz');
	const bpmInput = document.getElementById('accomp-bpm');
	const stopBtn = document.getElementById('accomp-stop');

	if (modeBlock) {
		modeBlock.addEventListener('change', () => {
			if (modeBlock.checked) setAccompanimentMode('block');
		});
	}
	if (modeArp) {
		modeArp.addEventListener('change', () => {
			if (modeArp.checked) setAccompanimentMode('arpeggio');
		});
	}
	if (styleBallad) {
		styleBallad.addEventListener('change', () => {
			if (styleBallad.checked) setArpeggioStyle('ballad');
		});
	}
	if (styleWaltz) {
		styleWaltz.addEventListener('change', () => {
			if (styleWaltz.checked) setArpeggioStyle('waltz');
		});
	}
	if (bpmInput) {
		bpmInput.addEventListener('input', () => {
			const next = parseInt(bpmInput.value, 10) || 72;
			const bpmValue = document.getElementById('accomp-bpm-value');
			if (bpmValue) bpmValue.textContent = String(next);
			setAccompanimentBpm(next);
		});
	}
	if (stopBtn) {
		stopBtn.addEventListener('click', () => stopPlayback());
	}
	updateAccompanimentUI();
}

function updateAccompanimentUI() {
	const styleGroup = document.getElementById('accomp-style-group');
	const modeBlock = document.getElementById('accomp-mode-block');
	const modeArp = document.getElementById('accomp-mode-arpeggio');
	const styleBallad = document.getElementById('accomp-style-ballad');
	const styleWaltz = document.getElementById('accomp-style-waltz');
	const bpmInput = document.getElementById('accomp-bpm');

	if (modeBlock) modeBlock.checked = accompanimentMode === 'block';
	if (modeArp) modeArp.checked = accompanimentMode === 'arpeggio';
	if (styleBallad) styleBallad.checked = arpeggioStyle === 'ballad';
	if (styleWaltz) styleWaltz.checked = arpeggioStyle === 'waltz';
	if (bpmInput) {
		bpmInput.value = String(bpm);
		bpmInput.setAttribute('aria-valuenow', String(bpm));
		bpmInput.setAttribute('aria-valuemin', '50');
		bpmInput.setAttribute('aria-valuemax', '200');
	}
	const bpmValue = document.getElementById('accomp-bpm-value');
	if (bpmValue) bpmValue.textContent = String(bpm);
	if (styleGroup) styleGroup.hidden = accompanimentMode !== 'arpeggio';
}

function initAudioPreload() {
	const warmup = () => {
		void preloadSamples();
	};
	document.addEventListener('pointerdown', warmup, { once: true, capture: true });
	document.addEventListener('keydown', warmup, { once: true, capture: true });
}

if (document.readyState === 'loading') {
	document.addEventListener('DOMContentLoaded', () => {
		initAccompanimentUI();
		initAudioPreload();
	});
} else {
	initAccompanimentUI();
	initAudioPreload();
}
