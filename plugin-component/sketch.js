// Sync with root sketch.js — 3-octave piano for extension popup
let pianoui = new PianoUI(12, 24, 600, 88, 3, 3);

function setup() {
	const canvas = createCanvas(624, 140);
	canvas.parent('sketch-holder');
	window.pianoui = pianoui;
	pianoui.currentTranspose = getGlobalTranspose();
}

function draw() {
	background('#0d1f12');
	pianoui.draw();
}

function mousePressed() {
	pianoui.onClicked(mouseX, mouseY);
}

function mouseReleased() {
	pianoui.onReleased();
}

function touchStarted() {
	pianoui.onClicked(mouseX, mouseY);
	return false;
}

function touchEnded() {
	pianoui.onReleased();
	return false;
}
