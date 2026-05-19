/** Rhythm templates for arpeggio accompaniment. Requires chord-voicing.js */

const COLOR_ROLE_PRIORITY = [
	'majorSeventh',
	'seventh',
	'sixth',
	'thirteenth',
	'flatThirteenth',
	'ninth',
	'sharpNinth',
	'flatNinth',
	'eleventh',
	'sharpEleventh',
];

const WALTZ_BAR1 = [
	{ beat: 0, durationBeats: 1.1, velocity: 0.9, role: 'root' },
	{ beat: 1, durationBeats: 0.45, velocity: 0.55, role: 'fifth' },
	{ beat: 2, durationBeats: 0.4, velocity: 0.48, role: 'third' },
];

const WALTZ_BAR2 = [
	{ beat: 0, durationBeats: 0.95, velocity: 0.78, role: 'root' },
	{ beat: 1, durationBeats: 0.42, velocity: 0.52, role: 'third' },
	{ beat: 2, durationBeats: 0.38, velocity: 0.5, role: 'seventh' },
];

const PATTERN_DEFS = {
	ballad: { meter: '4/4', beatsPerBar: 4, bars: 2, type: 'ascend' },
	waltz: { meter: '3/4', beatsPerBar: 3, bars: [WALTZ_BAR1, WALTZ_BAR2] },
};

/** Ballad ascending: bar1 R–3–5–(color|R'), bar2 3–5–(color)–R' */
const BALLAD_ASCEND_BAR1 = [
	{ beat: 0, durationBeats: 1.0, velocity: 0.88, step: 'root' },
	{ beat: 1, durationBeats: 0.72, velocity: 0.64, step: 'third' },
	{ beat: 2, durationBeats: 0.72, velocity: 0.58, step: 'middle' },
	{ beat: 3, durationBeats: 0.92, velocity: 0.7, step: 'peak' },
];

const BALLAD_ASCEND_BAR2 = [
	{ beat: 0, durationBeats: 0.72, velocity: 0.6, step: 'third' },
	{ beat: 1, durationBeats: 0.72, velocity: 0.56, step: 'middle' },
	{ beat: 2, durationBeats: 0.68, velocity: 0.52, step: 'peak' },
	{ beat: 3, durationBeats: 1.0, velocity: 0.86, step: 'rootUp' },
];

function beatToSeconds(beat, bpm) {
	return (beat * 60) / bpm;
}

function durationBeatsToSeconds(beats, bpm) {
	return (beats * 60) / bpm;
}

function octaveUpPitch(pitch) {
	const m = pitch.match(/^([A-G][#b]?)(\d+)$/);
	if (!m) return pitch;
	return m[1] + (parseInt(m[2], 10) + 1);
}

function voicingHasRole(voicing, role) {
	return voicing.notes.some((n) => n.role === role);
}

function pickColorRole(voicing) {
	for (let i = 0; i < COLOR_ROLE_PRIORITY.length; i++) {
		if (voicingHasRole(voicing, COLOR_ROLE_PRIORITY[i])) return COLOR_ROLE_PRIORITY[i];
	}
	return null;
}

/** 7 + 9/11/13: skip 5 in ascent (R–3–7–ext reads cleaner than R–3–5–7–9 in one bar). */
function shouldSkipFifthInAscent(voicing) {
	const has7 = voicingHasRole(voicing, 'seventh') || voicingHasRole(voicing, 'majorSeventh');
	const hasExt =
		voicingHasRole(voicing, 'ninth') ||
		voicingHasRole(voicing, 'thirteenth') ||
		voicingHasRole(voicing, 'eleventh') ||
		voicingHasRole(voicing, 'sharpEleventh');
	return has7 && hasExt;
}

function isSusVoicing(voicing) {
	return voicingHasRole(voicing, 'fourth') && !voicingHasRole(voicing, 'third');
}

/**
 * Resolve one ascending step to a pitch.
 * step keys: root | third | fifth | fourth | color | rootUp | middle | peak
 */
function resolveAscendStep(voicing, step, barPlan) {
	if (step === 'root') return pickNoteForRole(voicing, 'root');
	if (step === 'third') return pickNoteForRole(voicing, 'third');
	if (step === 'fifth') return pickNoteForRole(voicing, 'fifth');
	if (step === 'fourth') return pickNoteForRole(voicing, 'fourth');
	if (step === 'color') {
		return barPlan.peak || pickNoteForRole(voicing, 'fifth');
	}
	if (step === 'rootUp') return octaveUpPitch(pickNoteForRole(voicing, 'root'));
	if (step === 'middle') return barPlan.middle;
	if (step === 'peak') return barPlan.peak;
	return pickNoteForRole(voicing, 'root');
}

function buildBalladAscendPlan(voicing) {
	const sus = isSusVoicing(voicing);
	const colorRole = pickColorRole(voicing);
	const skip5 = !sus && shouldSkipFifthInAscent(voicing);
	const root = pickNoteForRole(voicing, 'root');
	const third = pickNoteForRole(voicing, 'third');
	const fifth = pickNoteForRole(voicing, 'fifth');
	const fourth = pickNoteForRole(voicing, 'fourth');
	const rootUp = octaveUpPitch(root);

	if (sus) {
		return {
			colorRole: null,
			bar1: { middle: fourth, peak: rootUp },
			bar2: { middle: fifth, peak: rootUp },
		};
	}

	if (!colorRole) {
		return {
			colorRole: null,
			bar1: { middle: fifth, peak: rootUp },
			bar2: { middle: fifth, peak: root },
		};
	}

	if (skip5) {
		const seventh = pickNoteForRole(voicing, 'seventh');
		const ext = pickNoteForRole(voicing, 'thirteenth') || pickNoteForRole(voicing, 'ninth') || pickNoteForRole(voicing, 'eleventh');
		return {
			colorRole,
			bar1: { middle: seventh, peak: ext },
			bar2: { middle: seventh, peak: ext },
		};
	}

	const peakPitch =
		colorRole === 'majorSeventh' || colorRole === 'seventh' || colorRole === 'sixth'
			? pickNoteForRole(voicing, 'seventh')
			: pickNoteForRole(voicing, 'thirteenth') ||
				pickNoteForRole(voicing, 'ninth') ||
				pickNoteForRole(voicing, 'eleventh') ||
				pickNoteForRole(voicing, 'seventh');

	return {
		colorRole,
		bar1: { middle: fifth, peak: peakPitch },
		bar2: { middle: fifth, peak: peakPitch },
	};
}

function buildBalladAscendEvents(voicing, bpm) {
	const spread = voicing.notes && voicing.notes.length ? voicing : spreadVoicingOctaves(voicing);
	const plan = buildBalladAscendPlan(spread);
	const events = [];
	const barTemplates = [BALLAD_ASCEND_BAR1, BALLAD_ASCEND_BAR2];

	for (let bar = 0; bar < barTemplates.length; bar++) {
		const slots = barTemplates[bar];
		const barPlan = bar === 0 ? plan.bar1 : plan.bar2;
		const barOffsetBeats = bar * 4;
		for (let s = 0; s < slots.length; s++) {
			const slot = slots[s];
			const pitch = resolveAscendStep(spread, slot.step, barPlan);
			if (!pitch) continue;
			let velocity = slot.velocity;
			if (slot.step === 'peak' && plan.colorRole && bar === 0) {
				velocity = Math.min(velocity, 0.58);
			}
			events.push({
				pitch,
				timeSec: beatToSeconds(barOffsetBeats + slot.beat, bpm),
				durationSec: durationBeatsToSeconds(slot.durationBeats, bpm),
				velocity,
			});
		}
	}

	return events;
}

function humanizeEvent(ev) {
	const timeJitter = (Math.random() - 0.5) * 0.024;
	const velJitter = (Math.random() - 0.5) * 0.08;
	return {
		...ev,
		timeSec: Math.max(0, ev.timeSec + timeJitter),
		velocity: Math.min(1, Math.max(0.2, ev.velocity + velJitter)),
	};
}

function buildSlotPatternEvents(voicing, patternId, bpm) {
	const def = PATTERN_DEFS[patternId] || PATTERN_DEFS.ballad;
	const spread = voicing.notes && voicing.notes.length ? voicing : spreadVoicingOctaves(voicing);
	const events = [];

	for (let bar = 0; bar < def.bars.length; bar++) {
		const slots = def.bars[bar];
		const barOffsetBeats = bar * def.beatsPerBar;
		for (let s = 0; s < slots.length; s++) {
			const slot = slots[s];
			const pitch = pickNoteForRole(spread, slot.role);
			if (!pitch) continue;
			const beat = barOffsetBeats + slot.beat;
			events.push({
				pitch,
				timeSec: beatToSeconds(beat, bpm),
				durationSec: durationBeatsToSeconds(slot.durationBeats, bpm),
				velocity: slot.velocity,
				role: slot.role,
			});
		}
	}

	return events.map(humanizeEvent);
}

function buildPatternEvents(voicing, patternId, bpm) {
	const def = PATTERN_DEFS[patternId] || PATTERN_DEFS.ballad;
	if (def.type === 'ascend') {
		return buildBalladAscendEvents(voicing, bpm).map(humanizeEvent);
	}
	return buildSlotPatternEvents(voicing, patternId, bpm);
}

function getPatternLoopDurationSec(patternId, bpm) {
	const def = PATTERN_DEFS[patternId] || PATTERN_DEFS.ballad;
	const barCount = typeof def.bars === 'number' ? def.bars : def.bars.length;
	const totalBeats = def.beatsPerBar * barCount;
	return beatToSeconds(totalBeats, bpm);
}

function getPatternMeter(patternId) {
	const def = PATTERN_DEFS[patternId] || PATTERN_DEFS.ballad;
	return def.meter;
}
