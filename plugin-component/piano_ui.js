function isInRegion(x, y, rect) {
	return x > rect.x && x <= rect.x + rect.w && y > rect.y && y <= rect.y + rect.h;
}

var PianoUI = function (x, y, w, h, o, nOctave) {
	this.x = x;
	this.y = y;
	this.w = w;
	this.h = h;
	this.o = o;
	this.nOctave = nOctave;
	this.keys = [];
	this.currentTranspose = getGlobalTranspose ? getGlobalTranspose() : 0;

	let step = 0;
	const stepWidth = this.w / (nOctave * 7 + 1);
	for (let i = 0; i < nOctave * 12 + 1; i++) {
		const name = NOTES[i % 12];
		const octave = Math.ceil((i + 1) / 12) + this.o;
		if (name.length === 1) {
			const key = new KeyUI(name, octave, 'white', stepWidth * step, 0, stepWidth, this.h);
			this.keys.push(key);
			step++;
		} else {
			const key = new KeyUI(name, octave, 'black', stepWidth * (step - 0.25), 0, stepWidth >> 1, this.h >> 1);
			this.keys.push(key);
		}
	}

	this.clearHighlights = function () {
		for (let i = 0; i < this.keys.length; i++) {
			this.keys[i].highlighted = false;
		}
	};

	this.setHighlightedNotes = function (noteNames) {
		this.clearHighlights();
		const names = Array.isArray(noteNames) ? noteNames : [noteNames];
		const set = new Set(names);
		for (let i = 0; i < this.keys.length; i++) {
			if (set.has(this.keys[i].getName())) {
				this.keys[i].highlighted = true;
			}
		}
	};

	this.incOct = function () {
		this.o++;
		for (let i = 0; i < this.keys.length; i++) {
			this.keys[i].o++;
		}
	};

	this.decOct = function () {
		this.o--;
		for (let i = 0; i < this.keys.length; i++) {
			this.keys[i].o--;
		}
	};

	this.draw = function () {
		push();
		translate(this.x, this.y);
		noStroke();
		fill('#132818');
		rect(0, -18, this.w, 18, 4, 4, 0, 0);
		fill('#52b788');
		textSize(10);
		textAlign(CENTER, CENTER);
		const label = formatTransposeValue ? formatTransposeValue(this.currentTranspose) : String(this.currentTranspose);
		text('♯/♭ ' + label, this.w / 2, -9);

		for (let i = 0; i < this.keys.length; i++) {
			if (this.keys[i].t === 'white') this.keys[i].draw();
		}
		for (let i = 0; i < this.keys.length; i++) {
			if (this.keys[i].t === 'black') this.keys[i].draw();
		}
		pop();
	};

	this.transposeUp = function () {
		if (this.currentTranspose < 6.5) {
			this.currentTranspose += 0.5;
			setGlobalTranspose(this.currentTranspose);
		}
	};

	this.transposeDown = function () {
		if (this.currentTranspose > -6) {
			this.currentTranspose -= 0.5;
			setGlobalTranspose(this.currentTranspose);
		}
	};

	let playedKey = null;
	this.onClicked = function (mx, my) {
		const nx = mx - this.x;
		const ny = my - this.y;
		const clickedKeys = [];

		for (let i = 0; i < this.keys.length; i++) {
			if (isInRegion(nx, ny, this.keys[i])) {
				clickedKeys.push(this.keys[i]);
			}
		}

		if (clickedKeys.length === 1) {
			playedKey = clickedKeys[0];
		} else if (clickedKeys.length === 2) {
			if (clickedKeys[0].t === 'black') playedKey = clickedKeys[0];
			else playedKey = clickedKeys[1];
		}

		if (playedKey != null) {
			this.clearHighlights();
			playSound(playedKey.getName(), 1);
			playedKey.state = 1;
		}
	};

	this.onReleased = function () {
		if (playedKey != null) {
			playedKey.state = 0;
			playedKey = null;
		}
	};
};
