// Popup-specific UI: audio load status
(function () {
	const statusEl = document.getElementById('load-status');

	function setStatus(text, ready) {
		if (!statusEl) return;
		statusEl.textContent = text;
		statusEl.classList.toggle('ready', !!ready);
	}

	if (typeof Tone !== 'undefined') {
		preloadSamples()
			.then(() => setStatus('Ready — key: ' + getCurrentKey(), true))
			.catch(() => setStatus('Sounds ready', true));
	} else {
		setStatus('Ready', true);
	}

	document.body.addEventListener(
		'click',
		() => {
			ensureAudioStarted();
			void preloadSamples();
		},
		{ once: true, capture: true }
	);
})();
