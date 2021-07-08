let pianoui = new PianoUI(50,50,400,100,3,3);

function setup(){
	var canvas = createCanvas(640, 480);
	canvas.parent('sketch-holder');
}

function draw(){
	background(255);
	
	pianoui.draw();
}

function mousePressed(){
	pianoui.onClicked(mouseX, mouseY);
}

function mouseReleased(){
	pianoui.onReleased();
}
function touchStarted(){
	pianoui.onClicked(mouseX, mouseY);
}

function touchEnded(){
	pianoui.onReleased();
}

function keyPressed(){
	
}